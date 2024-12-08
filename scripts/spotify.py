from spotify_web_downloader.downloader import Downloader
from pathlib import Path
import sys

def download(output_path, spotify_temp, cookies_file, widevine_device, ffmpeg_location, author, audio_url):
    downloader = Downloader(
        final_path=Path(output_path),
        temp_path=Path(spotify_temp),
        cookies_location=Path(cookies_file),
        wvd_location=Path(widevine_device),
        ffmpeg_location=ffmpeg_location,
        template_folder_album='',
        template_file_multi_disc=author,
        template_file_single_disc=author,
        audio_url=audio_url,
        aria2c_location=None,
        exclude_tags=None,
        truncate=40,
        premium_quality=False,
        template_folder_compilation=''
    )

    downloader.setup_cdm()
    downloader.setup_session()
    
    try:
        track = downloader.get_download_queue(audio_url)[0]
    except:
        raise ValueError("Couldn't check URL.")
    
    try:
        track_id = track['id']
        
        gid = downloader.uri_to_gid(track_id)
        metadata = downloader.get_metadata(gid)

        tags = downloader.get_tags(metadata, None)
        file_id = downloader.get_file_id(metadata)

        pssh = downloader.get_pssh(file_id)
        decryption_key = downloader.get_decryption_key(pssh)

        stream_url = downloader.get_stream_url(file_id)
        encrypted_location = downloader.get_encrypted_location(track_id)

        downloader.download_ytdlp(encrypted_location, stream_url)

        fixed_location = downloader.get_fixed_location(track_id)
        downloader.fixup(decryption_key, encrypted_location, fixed_location)

        final_location = downloader.get_final_location(tags)
        downloader.move_to_final_location(fixed_location, final_location)
    except Exception as e:
        raise Exception(f"Failed to download track: {e}")
    finally:
        downloader.cleanup_temp_path()

download(*sys.argv[1:])
