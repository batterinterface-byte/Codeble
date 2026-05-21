import 'package:just_audio/just_audio.dart';
import 'package:audio_session/audio_session.dart';
import '../models/models.dart';

enum RepeatMode { off, all, one }

class AudioPlayerService {
  final AudioPlayer _player = AudioPlayer();
  final ConcatenatingAudioSource _playlist = ConcatenatingAudioSource(
    children: [],
  );

  List<MediaItem> _queue = [];
  int _currentIndex = -1;
  RepeatMode _repeatMode = RepeatMode.off;
  bool _isShuffled = false;

  AudioPlayer get player => _player;
  List<MediaItem> get queue => _queue;
  int get currentIndex => _currentIndex;
  RepeatMode get repeatMode => _repeatMode;
  bool get isShuffled => _isShuffled;

  MediaItem? get currentMediaItem =>
      _currentIndex >= 0 && _currentIndex < _queue.length
          ? _queue[_currentIndex]
          : null;

  Future<void> init() async {
    final session = await AudioSession.instance;
    await session.configure(const AudioSessionConfiguration.music());

    _player.processingStateStream.listen((state) {
      if (state == ProcessingState.completed) {
        _handleTrackComplete();
      }
    });

    await _player.setAudioSource(_playlist);
  }

  Future<void> play(MediaItem item, {List<MediaItem>? queue}) async {
    if (queue != null) {
      _queue = List.from(queue);
      _currentIndex = _queue.indexWhere((i) => i.id == item.id);
    } else if (!_queue.any((i) => i.id == item.id)) {
      _queue.add(item);
      _currentIndex = _queue.length - 1;
    } else {
      _currentIndex = _queue.indexWhere((i) => i.id == item.id);
    }

    await _updatePlaylist();
    await _player.seek(Duration.zero, index: _currentIndex);
    await _player.play();
  }

  Future<void> playQueue(List<MediaItem> queue, {int startIndex = 0}) async {
    _queue = List.from(queue);
    _currentIndex = startIndex;
    await _updatePlaylist();
    await _player.seek(Duration.zero, index: _currentIndex);
    await _player.play();
  }

  Future<void> pause() async {
    await _player.pause();
  }

  Future<void> resume() async {
    await _player.play();
  }

  Future<void> togglePlayPause() async {
    if (_player.playing) {
      await pause();
    } else {
      await resume();
    }
  }

  Future<void> next() async {
    if (_queue.isEmpty) return;

    if (_isShuffled) {
      _currentIndex = _getRandomIndex();
    } else {
      _currentIndex = (_currentIndex + 1) % _queue.length;
    }

    await _player.seek(Duration.zero, index: _currentIndex);
    if (!_player.playing) {
      await _player.play();
    }
  }

  Future<void> previous() async {
    if (_queue.isEmpty) return;

    if (_player.position > Duration(seconds: 3)) {
      await _player.seek(Duration.zero);
      return;
    }

    if (_isShuffled) {
      _currentIndex = _getRandomIndex();
    } else {
      _currentIndex = (_currentIndex - 1 + _queue.length) % _queue.length;
    }

    await _player.seek(Duration.zero, index: _currentIndex);
    if (!_player.playing) {
      await _player.play();
    }
  }

  Future<void> seek(Duration position) async {
    await _player.seek(position);
  }

  Future<void> setVolume(double volume) async {
    await _player.setVolume(volume.clamp(0.0, 1.0));
  }

  Future<void> setSpeed(double speed) async {
    await _player.setSpeed(speed.clamp(0.25, 2.0));
  }

  void toggleShuffle() {
    _isShuffled = !_isShuffled;
  }

  void cycleRepeatMode() {
    switch (_repeatMode) {
      case RepeatMode.off:
        _repeatMode = RepeatMode.all;
        break;
      case RepeatMode.all:
        _repeatMode = RepeatMode.one;
        break;
      case RepeatMode.one:
        _repeatMode = RepeatMode.off;
        break;
    }
  }

  Future<void> removeFromQueue(int index) async {
    if (index < 0 || index >= _queue.length) return;

    if (_queue.length == 1) {
      _queue.clear();
      _currentIndex = -1;
      await _player.stop();
      return;
    }

    _queue.removeAt(index);

    if (index < _currentIndex) {
      _currentIndex--;
    } else if (index == _currentIndex) {
      if (_currentIndex >= _queue.length) {
        _currentIndex = 0;
      }
    }

    await _updatePlaylist();
  }

  Future<void> clearQueue() async {
    _queue.clear();
    _currentIndex = -1;
    await _player.stop();
    await _playlist.clear();
  }

  Future<void> moveQueueItem(int fromIndex, int toIndex) async {
    if (fromIndex < 0 ||
        fromIndex >= _queue.length ||
        toIndex < 0 ||
        toIndex >= _queue.length) {
      return;
    }

    final item = _queue.removeAt(fromIndex);
    _queue.insert(toIndex, item);

    if (fromIndex == _currentIndex) {
      _currentIndex = toIndex;
    } else if (fromIndex < _currentIndex && toIndex >= _currentIndex) {
      _currentIndex--;
    } else if (fromIndex > _currentIndex && toIndex <= _currentIndex) {
      _currentIndex++;
    }

    await _updatePlaylist();
  }

  Future<void> dispose() async {
    await _player.dispose();
  }

  void _handleTrackComplete() {
    switch (_repeatMode) {
      case RepeatMode.off:
        if (_currentIndex < _queue.length - 1) {
          next();
        } else {
          _player.pause();
        }
        break;
      case RepeatMode.all:
        next();
        break;
      case RepeatMode.one:
        _player.seek(Duration.zero);
        _player.play();
        break;
    }
  }

  int _getRandomIndex() {
    if (_queue.length <= 1) return 0;
    int newIndex;
    do {
      newIndex = DateTime.now().millisecondsSinceEpoch % _queue.length;
    } while (newIndex == _currentIndex);
    return newIndex;
  }

  Future<void> _updatePlaylist() async {
    final sources = _queue
        .map((item) => AudioSource.file(item.path, tag: item))
        .toList();
    await _playlist.clear();
    await _playlist.addAll(sources);
  }
}
