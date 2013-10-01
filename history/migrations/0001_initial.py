# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'History'
        db.create_table(u'history_history', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('timestamp', self.gf('django.db.models.fields.DateTimeField')()),
            ('tool', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('version', self.gf('django.db.models.fields.CharField')(max_length=10)),
            ('configuration', self.gf('django.db.models.fields.TextField')()),
            ('slurm_output', self.gf('django.db.models.fields.TextField')()),
            ('uid', self.gf('django.db.models.fields.CharField')(max_length=20)),
            ('status', self.gf('django.db.models.fields.IntegerField')(max_length=1)),
        ))
        db.send_create_signal(u'history', ['History'])

        # Adding model 'Result'
        db.create_table(u'history_result', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('history_id', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['history.History'])),
            ('output_file', self.gf('django.db.models.fields.TextField')()),
            ('file_type', self.gf('django.db.models.fields.IntegerField')(max_length=2)),
        ))
        db.send_create_signal(u'history', ['Result'])


    def backwards(self, orm):
        # Deleting model 'History'
        db.delete_table(u'history_history')

        # Deleting model 'Result'
        db.delete_table(u'history_result')


    models = {
        u'history.history': {
            'Meta': {'object_name': 'History'},
            'configuration': ('django.db.models.fields.TextField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'slurm_output': ('django.db.models.fields.TextField', [], {}),
            'status': ('django.db.models.fields.IntegerField', [], {'max_length': '1'}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {}),
            'tool': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'uid': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            'version': ('django.db.models.fields.CharField', [], {'max_length': '10'})
        },
        u'history.result': {
            'Meta': {'object_name': 'Result'},
            'file_type': ('django.db.models.fields.IntegerField', [], {'max_length': '2'}),
            'history_id': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['history.History']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'output_file': ('django.db.models.fields.TextField', [], {})
        }
    }

    complete_apps = ['history']