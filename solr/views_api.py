from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from hurry.filesize import alternative, size
from django.contrib.auth.decorators import login_required
import xarray as xr


@api_view(["POST"])
@login_required()
def ncdump(request):
    if request.user.isGuest():
        return Response(
            dict(
                ncdump="",
                error_msg="Guests are not allowed to perform ncdump",
            ),
            content_type="application/json",
            status=200,
        )

    input_file = [str(request.data.get("file"))]
    kwargs = dict(
        parallel=True,
        coords="minimal",
        data_vars="minimal",
        compat="override",
        combine="nested",
        concat_dim="time",
        chunks={"time": -1},
    )
    try:
        dset = xr.open_mfdataset(input_file, **kwargs)
    except Exception as e:
        return Response(
            dict(
                ncdump="",
                error_msg="Could not open dataset, file(s) might be corrupted",
            ),
            content_type="application/json",
            status=200,
        )
    fsize = size(dset.nbytes, system=alternative)
    out_str = xr.core.formatting_html.dataset_repr(dset)
    out_str = out_str.replace(
        "<svg class='icon xr-icon-file-text2'>", "<i class='fa fa-file-text-o'>"
    ).replace("numpy.", "")
    out_str = out_str.replace(
        "<svg class='icon xr-icon-database'>", "<i class='fa fa-database'>"
    )
    out_str = out_str.replace("xarray.Dataset", f"Dataset (byte-size: {fsize})")
    out_str = out_str.replace("</use></svg>", "</use></i>")

    return Response(
        dict(ncdump=out_str, error_msg=""),
        content_type="application/json",
        status=200,
    )
