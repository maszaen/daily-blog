<?php
header('Content-Type: application/json');

// Logika untuk mengambil data dari database atau melakukan operasi lainnya
$response = [
    'message' => 'Data berhasil diambil dari PHP backend!'
];

echo json_encode($response);
?>
