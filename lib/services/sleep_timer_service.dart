import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';

class SleepTimerService {
  final AudioPlayer _player;
  Timer? _timer;
  Duration _remaining = Duration.zero;
  Duration _totalDuration = Duration.zero;
  bool _isActive = false;
  VoidCallback? _onTimerComplete;

  SleepTimerService(this._player);

  Duration get remaining => _remaining;
  Duration get totalDuration => _totalDuration;
  bool get isActive => _isActive;

  void start(Duration duration, {VoidCallback? onComplete}) {
    cancel();
    _totalDuration = duration;
    _remaining = duration;
    _isActive = true;
    _onTimerComplete = onComplete;

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remaining.inSeconds > 0) {
        _remaining -= const Duration(seconds: 1);
      } else {
        cancel();
        _onTimerComplete?.call();
        _player.pause();
      }
    });
  }

  void cancel() {
    _timer?.cancel();
    _timer = null;
    _isActive = false;
    _remaining = Duration.zero;
    _totalDuration = Duration.zero;
  }

  void pause() {
    _timer?.cancel();
    _timer = null;
  }

  void resume() {
    if (_isActive && _remaining.inSeconds > 0) {
      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (_remaining.inSeconds > 0) {
          _remaining -= const Duration(seconds: 1);
        } else {
          cancel();
          _onTimerComplete?.call();
          _player.pause();
        }
      });
    }
  }

  void addTime(Duration duration) {
    _remaining += duration;
    _totalDuration += duration;
  }

  String get formattedRemaining {
    final minutes = _remaining.inMinutes;
    final seconds = _remaining.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  double get progress {
    if (_totalDuration.inMilliseconds == 0) return 0;
    return 1 - (_remaining.inMilliseconds / _totalDuration.inMilliseconds);
  }
}
