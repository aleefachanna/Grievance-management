from rest_framework import serializers
from .models import Organisation
from rest_framework import serializers
from .models import Organisation

class OrganisationCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Organisation
        fields = "__all__"
        read_only_fields = ["org_id", "slug", "created_at", "updated_at"]
class OrganisationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Organisation
        fields = [
            "id",
            "name",
            "slug",
            "city",
            "state",
            "organisation_type",
            "logo"
        ]