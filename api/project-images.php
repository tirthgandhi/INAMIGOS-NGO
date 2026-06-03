<?php
/**
 * Scans assets/images/projects/{id}/ and returns image lists (XAMPP / Apache).
 * Add photos to a project folder — refresh the page; no HTML edits needed.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');

$projectIds = ['bachpanshala', 'seva', 'udaan', 'jeev', 'prakriti', 'vikas'];
$allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
$baseDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'projects';

$projects = [];

foreach ($projectIds as $id) {
    $dir = $baseDir . DIRECTORY_SEPARATOR . $id;
    $images = [];

    if (is_dir($dir)) {
        $files = scandir($dir);
        if ($files !== false) {
            foreach ($files as $file) {
                if ($file === '.' || $file === '..') {
                    continue;
                }
                $path = $dir . DIRECTORY_SEPARATOR . $file;
                if (!is_file($path)) {
                    continue;
                }
                $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                if (!in_array($ext, $allowedExt, true)) {
                    continue;
                }
                $images[] = 'assets/images/projects/' . $id . '/' . $file;
            }
        }
        natsort($images);
        $images = array_values($images);
    }

    $projects[$id] = [
        'id' => $id,
        'folder' => 'assets/images/projects/' . $id,
        'images' => $images,
        'cover' => $images[0] ?? null,
    ];
}

echo json_encode([
    'source' => 'php',
    'generatedAt' => gmdate('c'),
    'projects' => $projects,
], JSON_UNESCAPED_SLASHES);
