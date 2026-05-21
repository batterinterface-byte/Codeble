import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/media_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<MediaProvider>(
        builder: (context, provider, child) {
          return ListView(
            children: [
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'Settings',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              _buildSection(
                'Media Library',
                [
                  ListTile(
                    leading: const Icon(Icons.folder_open),
                    title: const Text('Scan Device'),
                    subtitle: const Text('Scan device for media files'),
                    onTap: () {
                      provider.scanMedia();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Scanning device...')),
                      );
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.add),
                    title: const Text('Add Files'),
                    subtitle: const Text('Select files to add'),
                    onTap: () {
                      provider.addMediaFiles();
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.folder),
                    title: const Text('Add Folder'),
                    subtitle: const Text('Select a folder to scan'),
                    onTap: () {
                      provider.addMediaDirectory();
                    },
                  ),
                ],
              ),
              _buildSection(
                'Permissions',
                [
                  FutureBuilder<PermissionStatus>(
                    future: Permission.storage.status,
                    builder: (context, snapshot) {
                      final granted =
                          snapshot.data?.isGranted ?? false;
                      return ListTile(
                        leading: Icon(
                          granted
                              ? Icons.check_circle
                              : Icons.error_outline,
                          color: granted ? Colors.green : Colors.red,
                        ),
                        title: const Text('Storage Permission'),
                        subtitle: Text(granted ? 'Granted' : 'Not granted'),
                        trailing: granted
                            ? null
                            : ElevatedButton(
                                onPressed: () async {
                                  final status =
                                      await Permission.storage.request();
                                  if (status.isGranted) {
                                    await provider.scanMedia();
                                  }
                                },
                                child: const Text('Grant'),
                              ),
                      );
                    },
                  ),
                ],
              ),
              _buildSection(
                'Playback',
                [
                  ListTile(
                    leading: const Icon(Icons.clear_all),
                    title: const Text('Clear Playback History'),
                    subtitle: const Text('Remove saved playback positions'),
                    onTap: () {
                      _showClearConfirmation(
                        context,
                        'Clear Playback History?',
                        'This will remove all saved playback positions.',
                        () async {
                          await provider.storage.clearRecentlyPlayed();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content: Text('Playback history cleared')),
                            );
                          }
                        },
                      );
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.delete_sweep),
                    title: const Text('Clear Queue'),
                    subtitle: const Text('Remove all items from queue'),
                    onTap: () {
                      provider.audioPlayer.clearQueue();
                      _notifyProvider(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Queue cleared')),
                      );
                    },
                  ),
                ],
              ),
              _buildSection(
                'About',
                [
                  const ListTile(
                    leading: Icon(Icons.info_outline),
                    title: Text('Version'),
                    subtitle: Text('1.0.0'),
                  ),
                  ListTile(
                    leading: const Icon(Icons.privacy_tip_outlined),
                    title: const Text('Privacy Policy'),
                    onTap: () => _showPrivacyPolicy(context),
                  ),
                  ListTile(
                    leading: const Icon(Icons.support_agent),
                    title: const Text('Support'),
                    subtitle: const Text('theashiis.world@gmail.com'),
                    onTap: () => _launchSupportEmail(context),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              Center(
                child: Text(
                  'Music & Video Player v1.0.0',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  'Built with Flutter',
                  style: TextStyle(
                    color: Colors.grey[500],
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: children,
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  void _showClearConfirmation(
    BuildContext context,
    String title,
    String content,
    VoidCallback onConfirm,
  ) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(title),
          content: Text(content),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                onConfirm();
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
              child: const Text('Clear'),
            ),
          ],
        );
      },
    );
  }

  void _notifyProvider(BuildContext context) {
    final provider = Provider.of<MediaProvider>(context, listen: false);
    provider.refresh();
  }

  void _showPrivacyPolicy(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Privacy Policy'),
        content: const SingleChildScrollView(
          child: Text('''
Music & Video Player respects your privacy.

**Data Collection:**
This app does not collect, store, or transmit any personal data to external servers.

**Media Access:**
The app requires storage permissions to scan and play your local media files. All media data remains on your device and is never uploaded or shared.

**Local Storage:**
Playback history, playlists, favorites, and settings are stored locally on your device using SharedPreferences. This data is only accessible by this app.

**Permissions:**
• Storage/Media: Required to access your music and video files
• Notifications: Used for playback controls in the notification bar

**Third-Party Services:**
This app does not integrate with any third-party analytics, advertising, or tracking services.

**Updates:**
This privacy policy may be updated as the app evolves. Continued use of the app constitutes acceptance of any changes.

For questions or concerns, contact: theashiis.world@gmail.com
          '''),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Future<void> _launchSupportEmail(BuildContext context) async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: 'theashiis.world@gmail.com',
      query: 'subject=Music & Video Player Support',
    );
    if (await canLaunchUrl(emailUri)) {
      await launchUrl(emailUri);
    } else {
      // Fallback: show email address in a dialog
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Support'),
          content: const SelectableText(
            'Email: theashiis.world@gmail.com',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    }
  }
}
