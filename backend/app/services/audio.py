"""Audio file validation and metadata extraction."""
import io
import logging
from typing import Optional

log = logging.getLogger(__name__)

# Valid MP3 magic bytes
MP3_MAGIC_BYTES = [
    b"\xff\xfb",  # MPEG1 Layer3
    b"\xff\xf3",  # MPEG2 Layer3
    b"\xff\xf2",  # MPEG2.5 Layer3
    b"\xff\xfa",
    b"\xff\xe3",
    b"\xff\xe2",
    b"ID3",       # ID3 tag (most common MP3 header)
]

VALID_IMAGE_MAGIC = [
    b"\xff\xd8\xff",   # JPEG
    b"\x89PNG\r\n",    # PNG
    b"GIF8",           # GIF
    b"RIFF",           # WebP (partial)
]


def is_valid_mp3(file_bytes: bytes) -> bool:
    """Check if bytes represent a valid MP3 file via magic bytes."""
    if len(file_bytes) < 3:
        return False
    header = file_bytes[:10]
    return any(header.startswith(magic) for magic in MP3_MAGIC_BYTES)


def is_valid_image(file_bytes: bytes) -> bool:
    """Check if bytes represent a valid image file via magic bytes."""
    if len(file_bytes) < 4:
        return False
    header = file_bytes[:10]
    return any(header.startswith(magic) for magic in VALID_IMAGE_MAGIC)


def get_audio_duration(file_bytes: bytes) -> Optional[float]:
    """Extract audio duration in seconds using mutagen."""
    try:
        from mutagen.mp3 import MP3
        from mutagen import File as MutagenFile

        audio = MP3(io.BytesIO(file_bytes))
        return audio.info.length
    except Exception:
        # Fallback: try generic mutagen
        try:
            from mutagen import File as MutagenFile
            audio = MutagenFile(io.BytesIO(file_bytes))
            if audio and hasattr(audio.info, "length"):
                return audio.info.length
        except Exception:
            pass
    log.warning("Could not extract audio duration")
    return None


def get_image_content_type(file_bytes: bytes) -> str:
    """Determine image content type from magic bytes."""
    header = file_bytes[:10]
    if header.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if header.startswith(b"\x89PNG"):
        return "image/png"
    if header.startswith(b"GIF8"):
        return "image/gif"
    if header.startswith(b"RIFF"):
        return "image/webp"
    return "image/jpeg"  # default
