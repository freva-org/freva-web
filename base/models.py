from datetime import datetime

from django.contrib.auth.models import User
from django.db import models


def isGuest(self):
    groups = self.groups.filter(name="Guest")
    return len(groups) > 0


# monkeypatch the User class and add 'isGuest' method
User.add_to_class("isGuest", isGuest)


class UIMessages(models.Model):
    message = models.TextField()
    date = models.DateTimeField(default=datetime.now)
    resolved = models.BooleanField(default=False)
