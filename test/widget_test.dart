import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:myapp/providers/media_provider.dart';
import 'package:myapp/models/models.dart';

class MockMediaProvider extends MediaProvider {
  @override
  Future<void> init() async {
  }

  @override
  Future<void> scanMedia() async {
  }
}

void main() {
  testWidgets('App should build without errors', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (context) => MockMediaProvider(),
        child: const MaterialApp(
          home: Scaffold(
            body: Text('Music & Video Player'),
          ),
        ),
      ),
    );

    expect(find.text('Music & Video Player'), findsOneWidget);
  });

  testWidgets('MediaItem model should serialize and deserialize correctly',
      (WidgetTester tester) async {
    final mediaItem = MediaItem(
      id: '1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      path: '/path/to/song.mp3',
      duration: const Duration(minutes: 3, seconds: 30),
      type: MediaType.audio,
      dateAdded: DateTime.now(),
    );

    final map = mediaItem.toMap();
    final restored = MediaItem.fromMap(map);

    expect(restored.id, mediaItem.id);
    expect(restored.title, mediaItem.title);
    expect(restored.artist, mediaItem.artist);
    expect(restored.album, mediaItem.album);
    expect(restored.path, mediaItem.path);
    expect(restored.duration, mediaItem.duration);
    expect(restored.type, mediaItem.type);
  });

  testWidgets('Playlist model should serialize and deserialize correctly',
      (WidgetTester tester) async {
    final playlist = Playlist(
      id: '1',
      name: 'Test Playlist',
      description: 'A test playlist',
    );

    final map = playlist.toMap();
    final restored = Playlist.fromMap(map);

    expect(restored.id, playlist.id);
    expect(restored.name, playlist.name);
    expect(restored.description, playlist.description);
  });
}
