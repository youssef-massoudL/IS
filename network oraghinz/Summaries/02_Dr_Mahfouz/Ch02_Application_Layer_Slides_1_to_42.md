# Chapter 2: Application Layer — Slides 1–42 (Dr. Mahfouz)

*Source: `02_Dr_Mahfouz/Ch02_Application_Layer_Slides_1_to_42.pdf` (Kurose & Ross, 8th ed. — Slides 1–42 only, ending at Web caches)*

---

## 1. Principles of Network Applications
- **End-system execution:** Network apps run on **end systems** (not network-core routers/switches), enabling rapid app development.
- **Two Architectures:**
  1. **Client-Server:**
     - **Server:** Always-on host, permanent IP, often in data centers for scaling.
     - **Client:** Communicates with server, may be intermittently connected with dynamic IP, does *not* talk directly to other clients (e.g., HTTP, IMAP, FTP).
  2. **Peer-to-Peer (P2P):**
     - No always-on server; arbitrary end systems communicate directly.
     - **Self-scalability:** New peers bring both service capacity and demand; complex management (e.g., BitTorrent).
- **Processes & Sockets:**
  - **Client process** initiates communication; **Server process** waits to be contacted.
  - **Socket:** Software interface ("door") between the application process (controlled by app developer) and transport layer (controlled by OS).
  - **Addressing a process:** Requires **32-bit IP address** (host) + **Port number** (process on host, e.g., HTTP = `80`, Mail/SMTP = `25`).
- **Application-Layer Protocol Defines:** Message types (request/response), message **syntax** (fields), message **semantics** (field meanings), and **rules** for sending/responding.
  - *Open protocols* (RFCs: HTTP, SMTP) vs. *Proprietary protocols* (Skype, Zoom).

---

## 2. Transport Service Requirements & Internet Protocols
- **App Requirements:** Data integrity (no loss vs. loss-tolerant), timing (low delay), throughput (minimum vs. elastic), security.
  - *No-loss / elastic:* File transfer (FTP/TCP), Email (SMTP/TCP), Web (HTTP/TCP), Text messaging.
  - *Loss-tolerant / time-sensitive:* Real-time audio/video, streaming (HTTP/DASH over TCP), interactive games (UDP or TCP).
- **TCP Service:** **Reliable**, **flow control**, **congestion control**, **connection-oriented** (setup required). Does *not* guarantee timing, minimum throughput, or security.
- **UDP Service:** **Unreliable**, connectionless, no flow/congestion control, no timing/throughput/security guarantees (low overhead, no setup delay).
- **Securing TCP — TLS (Transport Layer Security):**
  - Vanilla TCP/UDP send cleartext (no encryption).
  - **TLS** (implemented at the **application layer** using libraries over TCP) provides **encrypted TCP connections**, **data integrity**, and **end-point authentication**.

---

## 3. Web and HTTP
- **Web page:** Base HTML file + referenced objects (images, audio, etc.), each addressable by a **URL** (`hostname/pathname`).
- **HTTP:** Application-layer protocol of the Web; **client/server** over **TCP (port 80)**; **stateless** (server keeps no history of past client requests).

### Non-Persistent vs. Persistent HTTP
- **Non-Persistent HTTP:** At most **1 object** per TCP connection, then connection closes.
  - **Response time per object:** `2 RTT + file transmission time` (1 RTT for TCP handshake + 1 RTT for HTTP request/response).
  - Issues: 2 RTTs per object + OS overhead per connection.
- **Persistent HTTP (HTTP/1.1):** Server leaves TCP connection open after response; multiple objects sent over **single TCP connection** → as little as **1 RTT** for all referenced objects.

### HTTP Messages
- **Request Message:** ASCII format:
  - **Request line:** `Method  URL  Version` (`GET`, `POST`, `HEAD`, `PUT`)
  - **Header lines:** `Host:`, `User-Agent:`, `Accept:`, `Connection:`, etc., ending with blank line (`\r\n`).
  - **Entity body:** Used by `POST` (form input) and `PUT` (file upload). (`GET` sends parameters in URL after `?`; `HEAD` requests headers only).
- **Response Message:**
  - **Status line:** `Version  StatusCode  Phrase`
    - `200 OK` — request succeeded
    - `301 Moved Permanently` — new URL in `Location:` header
    - `400 Bad Request` — not understood by server
    - `404 Not Found` — document not found
    - `505 HTTP Version Not Supported`
  - **Header lines** (`Date:`, `Server:`, `Last-Modified:`, `ETag:`, `Content-Length:`, `Content-Type:`) + requested data.

---

## 4. Cookies (Maintaining State)
- Because HTTP is stateless, websites use **cookies** with **4 components**:
  1. `Set-cookie:` header line in HTTP response.
  2. `Cookie:` header line in subsequent HTTP requests.
  3. Cookie file stored on user's host (managed by browser).
  4. Back-end database at the website.
- **Uses:** Authorization, shopping carts, recommendations, user session state.
- **First-party vs. Third-party Cookies:**
  - **First-party:** From the site the user chose to visit.
  - **Third-party (tracking cookies):** From embedded third-party sites (e.g., ad networks like `AdX.com`) that track browsing across multiple websites (disabled by default in Firefox/Safari; restricted under **GDPR** as personal data requiring user consent).

---

## 5. Web Caches (Slide 42)
- Browser is configured to send all HTTP requests to a local **Web cache (proxy server)**:
  - If object is in cache → cache returns object directly to client.
  - Else → cache requests object from **origin server**, stores a copy, and returns it to client.
- **Goal:** Satisfy client requests **without involving the origin server**.
