# Chapter 4: The OSI Reference Model (Dr. Ahmed Atwan)

*Source: `01_Dr_Ahmed_Atwan/Chapters_1_to_4_Review/Ch04_OSI_Model.pdf` (Book pp. 80–102)*

---

## 1. Overview & Purpose
- **OSI (Open Systems Interconnection)** Reference Model, approved in **1984** (by **ISO**).
- **Benefits:** Ensures compatibility between devices from different manufacturers, improves **scalability**, and standardizes protocol functions per layer.
- **Grouping:**
  - **Layers 7–4 (Upper / Transport Service to Host):** End-to-end communication between sender and destination.
  - **Layers 3–1 (Lower / Network Support):** Communication between network devices (node-to-node / hop-by-hop).

---

## 2. The 7 Layers Summary Table

| # | Layer | PDU (Data Unit) | Key Functions | Example Protocols / Standards |
| :--- | :--- | :--- | :--- | :--- |
| **7** | **Application** | Data / APDU | Network process to application, user/software interface, message formats | HTTP, FTP, DNS, SNMP, Telnet |
| **6** | **Presentation** | Data / PPDU | **Translation** (syntax/character sets), **Compression**, **Encryption/Decryption** | SSL, TLS |
| **5** | **Session** | Data / SPDU | Establish/manage/terminate sessions, **dialog control** (who speaks), **synchronization & checkpoints**, AAA | NetBIOS, PPTP |
| **4** | **Transport** | **Segment** (TPDU) | End-to-end (process-to-process) delivery, segmentation & reassembly, reliability, flow & error control | **TCP** (reliable, connection-oriented), **UDP** (best-effort, connectionless) |
| **3** | **Network** | **Packet** (Datagram) | **Logical addressing (IP)**, **routing / path determination**, fragmentation & reassembly, congestion control, QoS | IP (IPv4 32-bit, IPv6 128-bit), ARP, ICMP, IPSec *(Device: Router)* |
| **2** | **Data Link** | **Frame** | Reliable node-to-node transfer, **framing** (start/end boundaries), **physical addressing (MAC - 48-bit)**, error detection (CRC/FCS), flow control | Ethernet (IEEE 802.3), PPP, Wi-Fi (802.11) *(Device: Switch, Bridge)* |
| **1** | **Physical** | **Bit** (0s & 1s) | Raw bit transmission over physical medium, mechanical/electrical specs | Ethernet cables, USB, Bluetooth, 802.11 physical *(Device: Hub, Repeater)* |

---

## 3. Deep Dive on Key Layer Details
- **Layer 2 (Data Link) & Ethernet Frame:**
  - Frame structure: `Preamble (8B)` + `Dest MAC (6B)` + `Src MAC (6B)` + `Type/Length (2B)` + `Data/Payload (46–1500B)` + `CRC/FCS (4B)`.
  - Uses **SOF** (Start of Frame delimiter) and **FCS** (Frame Check Sequence) for error detection; can retransmit corrupted frames.
- **Layer 3 (Network):**
  - Routers inspect destination IP and use routing tables/algorithms to forward packets across different networks.
- **Layer 4 (Transport):**
  - **TCP:** Connection-oriented, guaranteed delivery, flow control, error recovery.
  - **UDP:** Connectionless, lightweight, best-effort delivery without connection overhead.
- **Layer 5 (Session):**
  - Uses **checkpoints (synchronization)** so interrupted transfers (e.g., database transactions) resume without losing progress, plus **dialog control** (e.g., who speaks in video conferences).
- **Layer 6 (Presentation):**
  - Hides machine differences (PC, Mac, Unix, Mainframe) via **translation**, **compression**, and **encryption**.
- **Layer 7 (Application):**
  - Highest abstraction layer used by both **OSI** and **TCP/IP** models.
