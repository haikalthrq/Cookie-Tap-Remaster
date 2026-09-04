# Dokumentasi Perbedaan Versi: Cookie Tap (Original vs Fork)

Dokumen ini memuat catatan teknis dan analisis komparatif antara versi asli (**upstream/original**) dari repositori [cookie-tap](https://github.com/risal098/cookie-tap) dengan versi modifikasi/fork lokal saat ini.

---

## 1. Latar Belakang Perubahan

Versi asli dari proyek ini dirancang khusus untuk platform **Replit** (versi legacy) dengan skema multi-service (dua repl server terpisah). Namun, seiring waktu dan kebutuhan untuk menjalankan proyek secara mandiri di komputer lokal (offline / on-premise):
1. Domain lama Replit (`https://cookie-1.risalahqz.repl.co` dan `https://cookie-2.risalahqz.repl.co`) sudah nonaktif/mati.
2. Hardcoded URL pada skrip frontend menyebabkan aplikasi tidak dapat digunakan sama sekali di lingkungan selain Replit asli.
3. Ketergantungan pada dua server/mesin terpisah menyulitkan pengujian dan *deployment* lokal.

Versi fork ini menyatukan kode menjadi aplikasi web satu server agar dapat langsung dijalankan di komputer lokal (offline) tanpa bergantung ke domain Replit.

---

## 2. Perbandingan Arsitektur Sistem

| Parameter | Versi Original (Upstream) | Versi Fork (Saat Ini) |
| :--- | :--- | :--- |
| **Model Arsitektur** | Dual-Server / Two-Machine Architecture | Standalone Single-Server Architecture |
| **Ketergantungan Server** | Membutuhkan 2 proses/mesin: <br>• Server 1 (`main.py`)<br>• Server 2 (`server2.py`) | Cukup 1 proses: <br>• Server `main.py` menangani game + leaderboard |
| **URL Routing Frontend** | URL Absolut Hardcoded ke Replit (`https://*.repl.co`) | Relative Paths (`/login`, `/registers`, `/sendCookies`, dll.) |
| **Manajemen Dependensi** | Tidak ada `requirements.txt` / `.venv` | Menggunakan `.venv` + `requirements.txt` resmi |
| **Leaderboard Processing** | POST HTTP request berkala dari Server 1 ke Server 2 via internet | Pemrosesan internal langsung di server lokal + file `leaderboard.json` |
| **Tingkat Portabilitas** | Rendah (terikat ke domain Replit) | Tinggi (bisa jalan di `localhost`, LAN, Docker, Cloud VPS) |

---

## 3. Rincian Perubahan per Berkas

### A. Dependensi & Environment
* **[NEW] `requirements.txt`**:
  * Menambahkan deklarasi pustaka yang dibutuhkan:
    * `Flask` (3.1.3)
    * `Flask-CORS` (6.0.5)
    * `requests` (2.34.2)
  * Menyiapkan virtual environment `.venv` agar tidak mencemari instalasi global Python.

---

### B. Backend (`main.py`)
* **Penggabungan Algoritma Leaderboard**:
  * Mengintegrasikan fungsi `sortBoard(data)` yang sebelumnya ada di `server2.py` ke dalam `main.py`.
* **Optimalisasi Background Thread**:
  * `sendLeaderboard()` sebelumnya mengirim payload HTTP POST ke domain Replit server 2 setiap 7 detik.
  * Pada versi fork, fungsi ini diubah menjadi `updateLeaderboard()` yang secara otomatis memperbarui file `leaderboard.json` secara lokal dan aman.
  * Thread dijalankan dengan `daemon=True` agar proses latar belakang tertutup otomatis saat server utama dimatikan.
* **Endpoint `/showLeaderboard`**:
  * Pada versi asli, route ini hanya menerima metode `GET` dan melakukan *forwarding* ke Replit server 2.
  * Pada versi fork, route ini mendukung metode `GET` dan `POST` (sesuai format fetch dari `leaderboard.html`) serta langsung mengembalikan isi `leaderboard.json` lokal.
* **Entry Point Guard**:
  * Menambahkan blok `if __name__ == '__main__':` standar Python.

---

### C. Frontend Templates

#### 1. `templates/index.html`
* **Logo & Navigasi**: Mengubah link `href="https://cookie-1.risalahqz.repl.co/..."` menjadi `/`, `/leaderboard`, `/register`, dan `/login`.
* **Form Actions**: Mengubah `action="https://cookie-1.risalahqz.repl.co/login"` dan `register` menjadi `/login` dan `/register`.

#### 2. `templates/login.html`
* **Navigasi Header**: Link logo diubah ke `/` dan link leaderboard ke `/leaderboard`.
* **Fetch Request**: `fetch('https://cookie-1.risalahqz.repl.co/logins', ...)` diubah menjadi `fetch('/logins', ...)`.
* **Redirect Sesi**: `location.replace("https://cookie-1.risalahqz.repl.co/cookie")` diubah menjadi `location.replace("/cookie")`.

#### 3. `templates/register.html`
* **Navigasi Header**: Link logo diubah ke `/` dan link leaderboard ke `/leaderboard`.
* **Fetch Request**: `fetch('https://cookie-1.risalahqz.repl.co/registers', ...)` diubah menjadi `fetch('/registers', ...)`.
* **Redirect Sukses**: `location.href = "https://cookie-1.risalahqz.repl.co"` diubah menjadi `location.href = "/"`.

#### 4. `templates/cookie.html` (Arena Bermain)
* **Navigasi Header**: Link logo dan leaderboard diubah menjadi relative URL.
* **Transfer Kuki (`giveCookies`)**: `fetch('https://cookie-1.risalahqz.repl.co/giveCookies', ...)` diubah menjadi `fetch('/giveCookies', ...)`.
* **Event Pencuri (`thief`)**: `fetch('https://cookie-1.risalahqz.repl.co/sendCookies', ...)` diubah menjadi `fetch('/sendCookies', ...)`.
* **Sinkronisasi Tampilan (`showCookies`)**: `fetch('https://cookie-1.risalahqz.repl.co/showCookies', ...)` diubah menjadi `fetch('/showCookies', ...)`.
* **Auto-save Loop (Interval 5 detik)**: `fetch('https://cookie-1.risalahqz.repl.co/sendCookies', ...)` diubah menjadi `fetch('/sendCookies', ...)`.

#### 5. `templates/leaderboard.html`
* **Navigasi Header**: Link logo diubah menjadi `/`.
* **Fetch Data Peringkat**: `fetch('https://cookie-2.risalahqz.repl.co/showLeaderboard', ...)` diubah menjadi `fetch('/showLeaderboard', ...)`.

---

### D. Server Sekunder (`server2.py`)
* **Status**: Masih dipertahankan di repositori untuk referensi historis, namun **tidak lagi wajib dijalankan**.
* Seluruh tugas perhitungan dan pengurutan papan peringkat telah disatukan secara otomatis ke dalam `main.py`.

---

## 4. Panduan Menjalankan Versi Fork Secara Lokal

### Prasyarat
* Python 3.10+ (teruji pada Python 3.14)

### Langkah Instalasi & Eksekusi
1. Aktifkan virtual environment atau buat yang baru:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\activate   # Windows
   # atau: source .venv/bin/activate (Linux/Mac)
   ```
2. Pasang pustaka dependensi:
   ```bash
   pip install -r requirements.txt
   ```
3. Jalankan server:
   ```bash
   python main.py
   ```
4. Buka peramban di alamat:
   **[http://localhost:8080](http://localhost:8080)**
