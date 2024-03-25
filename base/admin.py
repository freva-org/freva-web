from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Permission, User

from .models import UIMessages

admin.site.register(UIMessages)
admin.site.unregister(User)


class CustomUserAdmin(UserAdmin):
    save_on_top = True
    list_display = ("username", "email", "is_staff", "date_joined", "last_login")
    date_hierachy = "date_joined"
    ordering = ["-date_joined"]


admin.site.register(User, CustomUserAdmin)


class PermissionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "codename")


admin.site.register(Permission, PermissionAdmin)
