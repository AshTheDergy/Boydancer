from votify.spotify_api import SpotifyApi
from votify.enums import ( AudioQuality, DownloadMode, RemuxModeAudio )
from votify.downloader import Downloader
from votify.downloader_audio import DownloaderAudio
from votify.downloader_song import DownloaderSong
from pathlib import Path
import sys

def download(output_path, spotify_temp, cookies_file, widevine_device, ffmpeg_location, author, audio_url):
    spotify_api = SpotifyApi.from_cookies_file(cookies_file)
    if spotify_api.config_info["isAnonymous"]:
        raise ValueError("Failed to get a valid session. Try logging in and exporting your cookies again")
    
    downloader = Downloader(
        spotify_api,
        output_path=Path(output_path),
        temp_path=Path(spotify_temp),
        wvd_path=Path(widevine_device),
        aria2c_path='',
        ffmpeg_path=ffmpeg_location,
        mp4box_path='',
        mp4decrypt_path='',
        packager_path='',
        template_folder_album='',
        template_folder_compilation='',
        template_file_multi_disc=author,
        template_file_single_disc=author,
        exclude_tags='',
        truncate=40
    )

    downloader_audio = DownloaderAudio(
        downloader,
        audio_quality=AudioQuality.AAC_MEDIUM,
        download_mode=DownloadMode.YTDLP,
        remux_mode=RemuxModeAudio.FFMPEG
    )

    downloader_song = DownloaderSong(
        downloader_audio,
        lrc_only=False,
        no_lrc=True
    )

    downloader.set_cdm()
    
    try:
        url_info = downloader.get_url_info(audio_url)
        download_queue = downloader.get_download_queue(url_info.type, url_info.id)
    except:
        raise ValueError("Couldn't check URL.")
    
    try:
        download_queue_item = download_queue[0]
        media_metadata = download_queue_item.media_metadata

        media_id = downloader.get_media_id(media_metadata)
        media_type = media_metadata["type"]
        gid_metadata = downloader.get_gid_metadata(media_id, media_type)

        downloader_song.download(
                        track_id=media_id,
                        track_metadata=media_metadata,
                        album_metadata=download_queue_item.album_metadata,
                        gid_metadata=gid_metadata,
                        playlist_metadata=download_queue_item.playlist_metadata,
                        playlist_track=0
                        )

    except Exception as e:
        raise RuntimeError(f"Failed to download track: {e}")
    finally:
        downloader.cleanup_temp_path()

download(*sys.argv[1:])
