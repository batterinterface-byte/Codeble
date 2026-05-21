import 'media_item.dart';

class Playlist {
  final String id;
  String name;
  String? description;
  List<MediaItem> items;
  final DateTime createdAt;
  DateTime lastModified;

  Playlist({
    required this.id,
    required this.name,
    this.description,
    List<MediaItem>? items,
    DateTime? createdAt,
    DateTime? lastModified,
  })  : items = items ?? [],
        createdAt = createdAt ?? DateTime.now(),
        lastModified = lastModified ?? DateTime.now();

  Duration get totalDuration {
    return items.fold(Duration.zero, (prev, item) => prev + item.duration);
  }

  String get formattedDuration {
    final hours = totalDuration.inHours;
    final minutes = totalDuration.inMinutes % 60;
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    }
    return '${minutes}m';
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'items': items.map((item) => item.toMap()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'lastModified': lastModified.toIso8601String(),
    };
  }

  factory Playlist.fromMap(Map<String, dynamic> map) {
    return Playlist(
      id: map['id'],
      name: map['name'],
      description: map['description'],
      items: (map['items'] as List)
          .map((item) => MediaItem.fromMap(item as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.parse(map['createdAt']),
      lastModified: DateTime.parse(map['lastModified']),
    );
  }

  void addItem(MediaItem item) {
    if (!items.any((i) => i.id == item.id)) {
      items.add(item);
      lastModified = DateTime.now();
    }
  }

  void removeItem(String itemId) {
    items.removeWhere((item) => item.id == itemId);
    lastModified = DateTime.now();
  }

  Playlist copyWith({
    String? id,
    String? name,
    String? description,
    List<MediaItem>? items,
    DateTime? createdAt,
    DateTime? lastModified,
  }) {
    return Playlist(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      items: items ?? this.items,
      createdAt: createdAt ?? this.createdAt,
      lastModified: lastModified ?? this.lastModified,
    );
  }
}
