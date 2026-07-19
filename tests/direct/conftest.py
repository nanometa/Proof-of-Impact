import os


_original_unlink = os.unlink


def _windows_safe_unlink(path, *args, **kwargs):
    try:
        return _original_unlink(path, *args, **kwargs)
    except PermissionError:
        # genlayer-test keeps its fd-0 message file open briefly on Windows.
        return None


os.unlink = _windows_safe_unlink
