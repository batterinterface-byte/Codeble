import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import '../models/models.dart';

class MediaScannerService {
  static const List<String> audioExtensions = [
    '.mp3',
    '.wav',
    '.flac',
    '.aac',
    '.ogg',
    '.opus',
    '.m4a',
    '.wma',
    '.alac',
    '.aiff',
    '.ape',
  ];

  static const List<String> videoExtensions = [
    '.mp4',
    '.mkv',
    '.avi',
    '.mov',
    '.wmv',
    '.flv',
    '.webm',
    '.m4v',
    '.264',
    '.h264',
    '.265',
    '.h265',
    '.hevc',
    '.av1',
    '.ts',
    '.3gp',
    '.f4v',
  ];

  Future<List<MediaItem>> scanDeviceMedia() async {
    final mediaItems = <MediaItem>[];

    try {
      final directories = await _getMediaDirectories();

      for (final dir in directories) {
        final items = await _scanDirectory(dir.path);
        mediaItems.addAll(items);
      }
    } catch (e) {
      print('Error scanning device media: $e');
    }

    return mediaItems;
  }

  Future<List<MediaItem>> pickFiles() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: [...audioExtensions, ...videoExtensions]
          .map((e) => e.substring(1))
          .toList(),
    );

    if (result == null) return [];

    final mediaItems = <MediaItem>[];
    for (final file in result.files) {
      if (file.path != null) {
        final item = await _createMediaItem(File(file.path!));
        if (item != null) {
          mediaItems.add(item);
        }
      }
    }

    return mediaItems;
  }

  Future<List<MediaItem>> pickDirectory() async {
    final directory = await FilePicker.platform.getDirectoryPath();
    if (directory == null) return [];

    return _scanDirectory(directory);
  }

  Future<List<MediaItem>> scanCustomPath(String path) async {
    return _scanDirectory(path);
  }

  Future<List<Directory>> _getMediaDirectories() async {
    final directories = <Directory>[];

    try {
      final externalDir = await getExternalStorageDirectory();
      if (externalDir != null) {
        final parent = externalDir.parent;
        directories.add(parent);

        final musicDir = Directory('${parent.path}/Music');
        if (await musicDir.exists()) {
          directories.add(musicDir);
        }

        final moviesDir = Directory('${parent.path}/Movies');
        if (await moviesDir.exists()) {
          directories.add(moviesDir);
        }

        final downloadDir = Directory('${parent.path}/Download');
        if (await downloadDir.exists()) {
          directories.add(downloadDir);
        }
      }
    } catch (e) {
      print('Error getting media directories: $e');
    }

    return directories;
  }

  Future<List<MediaItem>> _scanDirectory(String path) async {
    final mediaItems = <MediaItem>[];
    final directory = Directory(path);

    if (!await directory.exists()) return mediaItems;

    try {
      await for (final entity in directory.list(
        recursive: true,
        followLinks: false,
      )) {
        if (entity is File) {
          final extension = entity.path.split('.').last.toLowerCase();
          if (audioExtensions.contains('.$extension') ||
              videoExtensions.contains('.$extension')) {
            final item = await _createMediaItem(entity);
            if (item != null) {
              mediaItems.add(item);
            }
          }
        }
      }
    } catch (e) {
      print('Error scanning directory $path: $e');
    }

    return mediaItems;
  }

  Future<MediaItem?> _createMediaItem(File file) async {
    try {
      final extension = file.path.split('.').last.toLowerCase();
      final fileName = file.path.split('/').last;
      final title = fileName.substring(0, fileName.lastIndexOf('.'));

      final type = audioExtensions.contains('.$extension')
          ? MediaType.audio
          : MediaType.video;

      final stat = await file.stat();
      final duration = await _estimateDuration(file, type);

      return MediaItem(
        id: file.path.hashCode.toString(),
        title: title,
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        path: file.path,
        duration: duration,
        type: type,
        dateAdded: stat.modified,
      );
    } catch (e) {
      print('Error creating media item for ${file.path}: $e');
      return null;
    }
  }

  Future<Duration> _estimateDuration(File file, MediaType type) async {
    try {
      if (type == MediaType.audio) {
        final fileSize = await file.length();
        final estimatedBitrate = 128000;
        final durationSeconds = (fileSize * 8) / estimatedBitrate;
        return Duration(seconds: durationSeconds.toInt());
      } else {
        final fileSize = await file.length();
        final estimatedBitrate = 1000000;
        final durationSeconds = (fileSize * 8) / estimatedBitrate;
        return Duration(seconds: durationSeconds.toInt());
      }
    } catch (e) {
      return Duration(minutes: 3);
    }
  }

  static bool isAudioFile(String path) {
    final extension = path.split('.').last.toLowerCase();
    return audioExtensions.contains('.$extension');
  }

  static bool isVideoFile(String path) {
    final extension = path.split('.').last.toLowerCase();
    return videoExtensions.contains('.$extension');
  }
}
