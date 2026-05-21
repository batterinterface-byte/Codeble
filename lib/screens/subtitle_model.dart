class SubtitleEntry {
  final int index;
  final Duration start;
  final Duration end;
  final String text;

  const SubtitleEntry({
    required this.index,
    required this.start,
    required this.end,
    required this.text,
  });
}

class SubtitleParser {
  static List<SubtitleEntry> parse(String content) {
    final subtitles = <SubtitleEntry>[];

    if (content.contains('WEBVTT')) {
      return _parseVTT(content);
    } else if (content.contains('[Script Info]')) {
      return _parseASS(content);
    } else {
      return _parseSRT(content);
    }
  }

  static List<SubtitleEntry> _parseSRT(String content) {
    final subtitles = <SubtitleEntry>[];
    final blocks = content.split('\n\n');

    for (final block in blocks) {
      final lines = block.trim().split('\n');
      if (lines.length >= 3) {
        try {
          final index = int.tryParse(lines[0]) ?? subtitles.length;
          final timeParts = lines[1].split(' --> ');
          if (timeParts.length == 2) {
            final start = _parseTimecode(timeParts[0].trim());
            final end = _parseTimecode(timeParts[1].trim());
            final text = lines.sublist(2).join('\n');

            subtitles.add(SubtitleEntry(
              index: index,
              start: start,
              end: end,
              text: text,
            ));
          }
        } catch (e) {
          continue;
        }
      }
    }

    return subtitles;
  }

  static List<SubtitleEntry> _parseVTT(String content) {
    final subtitles = <SubtitleEntry>[];
    final lines = content.split('\n');
    int index = 0;
    Duration? currentStart;
    Duration? currentEnd;
    final textBuffer = <String>[];

    for (final line in lines) {
      final trimmed = line.trim();

      if (trimmed.contains('-->')) {
        if (currentStart != null && currentEnd != null && textBuffer.isNotEmpty) {
          subtitles.add(SubtitleEntry(
            index: index++,
            start: currentStart!,
            end: currentEnd!,
            text: textBuffer.join('\n'),
          ));
          textBuffer.clear();
        }

        final parts = trimmed.split('-->');
        if (parts.length == 2) {
          currentStart = _parseVTTTimecode(parts[0].trim());
          currentEnd = _parseVTTTimecode(parts[1].trim().split(' ')[0]);
        }
      } else if (trimmed.isNotEmpty && !trimmed.startsWith('WEBVTT') && !trimmed.startsWith('NOTE')) {
        if (currentStart != null && currentEnd != null) {
          textBuffer.add(trimmed);
        }
      }
    }

    if (currentStart != null && currentEnd != null && textBuffer.isNotEmpty) {
      subtitles.add(SubtitleEntry(
        index: index,
        start: currentStart!,
        end: currentEnd!,
        text: textBuffer.join('\n'),
      ));
    }

    return subtitles;
  }

  static List<SubtitleEntry> _parseASS(String content) {
    final subtitles = <SubtitleEntry>[];
    final lines = content.split('\n');
    bool inEvents = false;

    for (final line in lines) {
      if (line.startsWith('[Events]')) {
        inEvents = true;
        continue;
      }

      if (inEvents && line.startsWith('Dialogue:')) {
        final parts = line.substring(9).split(',');
        if (parts.length >= 10) {
          try {
            final start = _parseASSTimecode(parts[1].trim());
            final end = _parseASSTimecode(parts[2].trim());
            final text = parts.sublist(9).join(',').replaceAll('{\\...}', '');

            subtitles.add(SubtitleEntry(
              index: subtitles.length,
              start: start,
              end: end,
              text: text,
            ));
          } catch (e) {
            continue;
          }
        }
      }
    }

    return subtitles;
  }

  static Duration _parseTimecode(String timecode) {
    final parts = timecode.replaceAll(',', ':').split(':');
    if (parts.length >= 3) {
      final hours = int.tryParse(parts[0]) ?? 0;
      final minutes = int.tryParse(parts[1]) ?? 0;
      final seconds = int.tryParse(parts[2]) ?? 0;
      final milliseconds = parts.length > 3 ? int.tryParse(parts[3]) ?? 0 : 0;

      return Duration(
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        milliseconds: milliseconds,
      );
    }
    return Duration.zero;
  }

  static Duration _parseVTTTimecode(String timecode) {
    final parts = timecode.split(':');
    if (parts.length == 3) {
      final hours = int.tryParse(parts[0]) ?? 0;
      final minutes = int.tryParse(parts[1]) ?? 0;
      final secParts = parts[2].split('.');
      final seconds = int.tryParse(secParts[0]) ?? 0;
      final milliseconds = secParts.length > 1 ? int.tryParse(secParts[1]) ?? 0 : 0;

      return Duration(
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        milliseconds: milliseconds,
      );
    } else if (parts.length == 2) {
      final minutes = int.tryParse(parts[0]) ?? 0;
      final secParts = parts[1].split('.');
      final seconds = int.tryParse(secParts[0]) ?? 0;
      final milliseconds = secParts.length > 1 ? int.tryParse(secParts[1]) ?? 0 : 0;

      return Duration(
        minutes: minutes,
        seconds: seconds,
        milliseconds: milliseconds,
      );
    }
    return Duration.zero;
  }

  static Duration _parseASSTimecode(String timecode) {
    final parts = timecode.split(':');
    if (parts.length == 3) {
      final hours = int.tryParse(parts[0]) ?? 0;
      final minutes = int.tryParse(parts[1]) ?? 0;
      final seconds = double.tryParse(parts[2]) ?? 0;

      return Duration(
        hours: hours,
        minutes: minutes,
        milliseconds: (seconds * 1000).toInt(),
      );
    }
    return Duration.zero;
  }
}
