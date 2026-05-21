import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

class PermissionDialog extends StatefulWidget {
  final VoidCallback onPermissionsGranted;

  const PermissionDialog({super.key, required this.onPermissionsGranted});

  @override
  State<PermissionDialog> createState() => _PermissionDialogState();
}

class _PermissionDialogState extends State<PermissionDialog> {
  final Map<Permission, PermissionStatus> _statuses = {};
  bool _isRequesting = false;

  final List<PermissionInfo> _requiredPermissions = [
    PermissionInfo(
      permission: Permission.storage,
      title: 'Storage Access',
      description: 'Access your media files to play music and videos',
      icon: Icons.folder,
    ),
    PermissionInfo(
      permission: Permission.mediaLibrary,
      title: 'Media Library',
      description: 'Scan and organize your music and video collection',
      icon: Icons.library_music,
    ),
    PermissionInfo(
      permission: Permission.notification,
      title: 'Notifications',
      description: 'Show playback controls in notification',
      icon: Icons.notifications,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _checkPermissions();
  }

  Future<void> _checkPermissions() async {
    final statuses = <Permission, PermissionStatus>{};
    for (final permInfo in _requiredPermissions) {
      statuses[permInfo.permission] = await permInfo.permission.status;
    }
    setState(() => _statuses.addAll(statuses));
  }

  Future<void> _requestPermissions() async {
    setState(() => _isRequesting = true);

    for (final permInfo in _requiredPermissions) {
      final status = await permInfo.permission.request();
      setState(() {
        _statuses[permInfo.permission] = status;
      });
    }

    setState(() => _isRequesting = false);

    final allGranted = _statuses.values.every((s) => s.isGranted);
    if (allGranted) {
      widget.onPermissionsGranted();
    }
  }

  Future<void> _openSettings() async {
    await openAppSettings();
    await _checkPermissions();
  }

  bool get _allGranted => _statuses.values.every((s) => s.isGranted);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Theme.of(context).colorScheme.primary,
                      Theme.of(context).colorScheme.secondary,
                    ],
                  ),
                ),
                child: const Icon(
                  Icons.play_circle_filled,
                  size: 60,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'Welcome to Music & Video Player',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'We need some permissions to access your media files and provide the best experience.',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              Expanded(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: _requiredPermissions.length,
                  itemBuilder: (context, index) {
                    final permInfo = _requiredPermissions[index];
                    final status = _statuses[permInfo.permission];
                    return _PermissionCard(
                      info: permInfo,
                      status: status,
                      onGrant: () => permInfo.permission.request().then((s) {
                        setState(() => _statuses[permInfo.permission] = s);
                      }),
                      onSettings: _openSettings,
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isRequesting ? null : _requestPermissions,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isRequesting
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text(
                          'Grant Permissions',
                          style: TextStyle(fontSize: 16),
                        ),
                ),
              ),
              if (!_allGranted) ...[
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => widget.onPermissionsGranted(),
                  child: const Text('Continue with limited features'),
                ),
              ],
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class PermissionInfo {
  final Permission permission;
  final String title;
  final String description;
  final IconData icon;

  const PermissionInfo({
    required this.permission,
    required this.title,
    required this.description,
    required this.icon,
  });
}

class _PermissionCard extends StatelessWidget {
  final PermissionInfo info;
  final PermissionStatus? status;
  final VoidCallback onGrant;
  final VoidCallback onSettings;

  const _PermissionCard({
    required this.info,
    required this.status,
    required this.onGrant,
    required this.onSettings,
  });

  @override
  Widget build(BuildContext context) {
    final isGranted = status?.isGranted ?? false;
    final isPermanentlyDenied = status?.isPermanentlyDenied ?? false;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isGranted
                    ? Colors.green.withOpacity(0.1)
                    : Theme.of(context).colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                isGranted ? Icons.check_circle : info.icon,
                color: isGranted
                    ? Colors.green
                    : Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    info.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    info.description,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            if (isPermanentlyDenied)
              TextButton(
                onPressed: onSettings,
                child: const Text('Open Settings'),
              )
            else if (!isGranted)
              TextButton(
                onPressed: onGrant,
                child: const Text('Grant'),
              ),
          ],
        ),
      ),
    );
  }
}
