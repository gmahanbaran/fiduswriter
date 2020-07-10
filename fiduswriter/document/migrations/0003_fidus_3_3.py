import os
import json
import zipfile
import tempfile
from decimal import Decimal

from django.db import migrations, models
from django.core.files import File

# FW 3.2 documents can be upgraded to 3.3 by adding IDs to lists and tables
OLD_FW_DOCUMENT_VERSION = 3.2
FW_DOCUMENT_VERSION = 3.3

ID_COUNTER = 0

def update_node(node):
    global ID_COUNTER
    if "contents" in node:  # revision
        update_node(node["contents"])
    if "type" in node and node["type"] in ["table", "bullet_list", "ordered_list"]:
        if node["type"] == "table":
            prefix = "T"
        else:
            prefix = "L"
        if not "attrs" in node:
            node["attrs"] = {}
        ID_COUNTER += 1
        node["attrs"]["id"] = "{}{:0>8d}".format(prefix, ID_COUNTER)
    if "content" in node:
        for sub_node in node["content"]:
            update_node(sub_node)

def update_document_string(doc_string):
    doc = json.loads(doc_string)
    update_node(doc)
    return json.dumps(doc)

# from https://stackoverflow.com/questions/25738523/how-to-update-one-file-inside-zip-file-using-python
def update_revision_zip(file_field, file_name):
    # generate a temp file
    tmpfd, tmpname = tempfile.mkstemp()
    os.close(tmpfd)
    # create a temp copy of the archive without filename
    with zipfile.ZipFile(file_field.open(), 'r') as zin:
        with zipfile.ZipFile(tmpname, 'w') as zout:
            zout.comment = zin.comment # preserve the comment
            for item in zin.infolist():
                if item.filename == 'filetype-version':
                    zout.writestr(item, str(FW_DOCUMENT_VERSION))
                elif item.filename == 'document.json':
                    doc_string = zin.read(item.filename)
                    #print(doc_string)
                    #print(update_document_string(doc_string))
                    zout.writestr(
                        item,
                        update_document_string(doc_string)
                    )
                else:
                    zout.writestr(item, zin.read(item.filename))
    # replace with the temp archive
    with open(tmpname, 'rb') as tmp_file:
        file_field.save(file_name, File(tmp_file))
    os.remove(tmpname)

def update_documents(apps, schema_editor):
    Document = apps.get_model('document', 'Document')
    documents = Document.objects.all()
    for document in documents:
        if document.doc_version == Decimal(str(OLD_FW_DOCUMENT_VERSION)):
            document.contents = update_document_string(document.contents)
            document.doc_version = FW_DOCUMENT_VERSION
            document.save()

    DocumentTemplate = apps.get_model('document', 'DocumentTemplate')
    templates = DocumentTemplate.objects.all()
    for template in templates:
        if template.doc_version == Decimal(str(OLD_FW_DOCUMENT_VERSION)):
            template.definition = update_document_string(template.definition)
            template.doc_version = FW_DOCUMENT_VERSION
            template.save()

    DocumentRevision = apps.get_model('document', 'DocumentRevision')
    revisions = DocumentRevision.objects.all()
    for revision in revisions:
        if not revision.file_object:
            revision.delete()
            continue
        if revision.doc_version == Decimal(str(OLD_FW_DOCUMENT_VERSION)):
            revision.doc_version = FW_DOCUMENT_VERSION
            revision.save()
            # Set the version number also in the zip file.
            update_revision_zip(revision.file_object, revision.file_name)


class Migration(migrations.Migration):

    dependencies = [
        ('document', '0002_fidus_3_2'),
    ]

    operations = [
        migrations.AlterField(
            model_name='document',
            name='doc_version',
            field=models.DecimalField(decimal_places=1, default=3.3, max_digits=3),
        ),
        migrations.AlterField(
            model_name='documentrevision',
            name='doc_version',
            field=models.DecimalField(decimal_places=1, default=3.3, max_digits=3),
        ),
        migrations.AlterField(
            model_name='documenttemplate',
            name='doc_version',
            field=models.DecimalField(decimal_places=1, default=3.3, max_digits=3),
        ),
        migrations.RunPython(update_documents),
    ]