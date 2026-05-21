enum MediaType { audio, video }

class MediaItem {
  final String id;
  final String title;
  final String artist;
  final String album;
  final String path;
  final Duration duration;
  final MediaType type;
  final String? artworkPath;
  final DateTime dateAdded;
  bool isFavorite;

  MediaItem({
    required this.id,
    required this.title,
    required this.artist,
    required this.album,
    required this.path,
    required this.duration,
    required this.type,
    this.artworkPath,
    required this.dateAdded,
    this.isFavorite = false,
  });

  String get formattedDuration {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'artist': artist,
      'album': album,
      'path': path,
      'duration': duration.inMilliseconds,
      'type': type == MediaType.audio ? 'audio' : 'video',
      'artworkPath': artworkPath,
      'dateAdded': dateAdded.toIso8601String(),
      'isFavorite': isFavorite,
    };
  }

  factory MediaItem.fromMap(Map<String, dynamic> map) {
    return MediaItem(
      id: map['id'],
      title: map['title'],
      artist: map['artist'],
      album: map['album'],
      path: map['path'],
      duration: Duration(milliseconds: map['duration']),
      type: map['type'] == 'audio' ? MediaType.audio : MediaType.video,
      artworkPath: map['artworkPath'],
      dateAdded: DateTime.parse(map['dateAdded']),
      isFavorite: map['isFavorite'] ?? false,
    );
  }

  MediaItem copyWith({
    String? id,
    String? title,
    String? artist,
    String? album,
    String? path,
    Duration? duration,
    MediaType? type,
    String? artworkPath,
    DateTime? dateAdded,
    bool? isFavorite,
  }) {
    return MediaItem(
      id: id ?? this.id,
      title: title ?? this.title,
      artist: artist ?? this.artist,
      album: album ?? this.album,
      path: path ?? this.path,
      duration: duration ?? this.duration,
      type: type ?? this.type,
      artworkPath: artworkPath ?? this.artworkPath,
      dateAdded: dateAdded ?? this.dateAdded,
      isFavorite: isFavorite ?? this.isFavorite,
    );
  }
}
