# Chapter 5: Protocols (Dr. Ahmed Atwan)

*Source: `01_Dr_Ahmed_Atwan/Chapters_5_to_7_Explained/Ch05_Protocols.pdf` (Book pp. 103–162)*  
*Note: Dr. Atwan started explaining in lectures from Chapter 5.*

---

## 1. What Is a Network Protocol?
A **protocol** is a set of rules governing communication between networked computers (topologies, access methods, cables).

**3 Essential Elements:**
1. **Syntax:** Structure/format and order of data (e.g., first 8 bits = sender, next 8 bits = destination, rest = message).
2. **Semantics:** Meaning of each bit section and the action to take based on it.
3. **Timing:** When data should be sent and how fast.

- **Protocol Stack:** Collection of protocols defining interfaces between all layers.

---

## 2. Core Network & Transport Protocols

| Protocol | Layer | Purpose & Key Details |
| :--- | :--- | :--- |
| **ARP** (Address Resolution Protocol) | Data Link / Network boundary | Maps **IP (logical) → MAC (physical)** address on a local network. Broadcasts ARP request; target replies with its MAC; stored in **ARP cache**. Vulnerable to **ARP spoofing/poisoning**. |
| **RARP** (Reverse ARP) | Data Link / Network | Maps **MAC (physical) → IP (logical)** address using an RARP server. |
| **ICMP** (Internet Control Message Protocol) | Network (Internet) | Sends **error reporting** and **control/request** messages between routers/hosts inside IP datagrams (does not trigger another ICMP on error). |
| **UDP** (User Datagram Protocol) | Transport (Layer 4) | **Connectionless**, unreliable, no windowing/sequencing/ACKs; **8-byte header** (Src Port, Dst Port, Length, Checksum). Best for low-latency/real-time apps (streaming, gaming). |
| **TCP** (Transmission Control Protocol) | Transport (Layer 4) | **Connection-oriented**, reliable; handles multiplexing, segmentation/reassembly, flow control, error recovery. |
| **IP** (Internet Protocol) | Network / Internet | Logical addressing & routing packets across networks. IPv4 header includes Version, IHL, TOS, Total Length, ID, Flags (DF/MF), Fragment Offset, **TTL**, Protocol, Checksum, Src/Dst IP. |
| **IPX / SPX** | Network / Transport | Legacy **Novell NetWare** protocol suite (IPX = network, SPX = transport). |

---

## 3. Application Layer Protocols

| Protocol | Default / Function | Key Details |
| :--- | :--- | :--- |
| **HTTP / HTTPS** | Web (Port **80 / 8080**; HTTPS uses SSL/TLS) | Client-server **request-response** over TCP; **stateless** (uses **cookies** for state); methods: `GET`, `POST`, `PUT`, `DELETE`; uses **URLs/URIs**, headers, caching, redirection; versions HTTP/1.1, HTTP/2. |
| **SMTP** | Sending email (**TCP Port 25**) | Simple, text-based protocol for sending email between mail servers/clients. |
| **POP3** | Receiving email | Downloads mail from server to client mailbox. |
| **IMAP** | Receiving email | Accesses and manages emails directly on the remote mail server. |
| **FTP** | File transfer (upload/download) | Uses **two channels**: **control channel** (commands) + **data channel** (files); supports ASCII & binary modes; plain text (use **FTPS** or **SFTP** for security). |
| **TFTP** | Simple file transfer | Lightweight alternative to FTP; no authentication/directory visibility; message types: Read Request, Write Request, DATA, ACK, ERROR. |
| **DHCP** | Dynamic IP assignment | Assigns IP, subnet mask, default gateway, DNS automatically with a lease time. Works in **4 phases (DORA)**: **D**iscover → **O**ffer (book says Observe/Offer) → **R**equest → **A**cknowledge. |
| **SNMP** | Network management | Manages devices using **SNMP Manager**, **SNMP Agent**, and **MIB**; operations: `Get`, `GetNext`, `GetBulk`, `Set`, `GetResponse`, `Trap`. |
| **PPTP** | VPN tunneling | Point-to-Point Tunneling Protocol; encapsulates PPP frames (via GRE over IP) for Client-to-LAN and LAN-to-LAN VPNs. |

---

## 4. Data Link, LAN & WAN Protocols
- **DLC (Data Link Control):** Synchronous & asynchronous link protocols.
  - **HDLC** (High-Level Data Link Control) & **SDLC** (Synchronous Data Link Control): Bit-oriented synchronous protocols supporting half/full-duplex, ordered error-free delivery.
- **ARCNET:** Token-bus LAN; token = `1` to send, reset to `0` after target reads.
- **FDDI:** ANSI standard dual token-ring optical LAN; up to **200 km**, **100 Mbps**, **500 stations**.
- **X.25:** Legacy ITU (CCITT, 1976) WAN standard (Physical, Data Link LAPB/LAPD, Packet Layer).
- **ATM:** **155 Mbps**, **fixed-size 53-byte packets (cells)**, connection-oriented, supports voice/video/data.
- **Ethernet (IEEE 802.3) & CSMA/CD:**
  - Key IEEE standards: `802.3u` (Fast Ethernet), `802.3z` (Gigabit Ethernet), `802.1D` (STP), `802.1w` (RSTP), `802.1Q` (VLAN), `802.3ad` (LACP), `802.3x` (Flow Control), `802.5` (Token Ring, differential Manchester encoding).
  - **CSMA/CD (Carrier Sense Multiple Access / Collision Detection):** Listen before transmitting → if busy, wait → if collision occurs, send **jam signal**, wait random **backoff**, and retransmit.

---

## 5. OSI (7 Layers) vs. TCP/IP (4 Layers)

| OSI Model (7 Layers) | TCP/IP Model (4 Layers) |
| :--- | :--- |
| 7. Application / 6. Presentation / 5. Session | **Application Layer** (HTTP, FTP, SMTP, DNS, Telnet, SNMP) |
| 4. Transport | **Transport Layer** (TCP, UDP) |
| 3. Network | **Internet Layer** (IP, ICMP, IGMP, IPSec) |
| 2. Data Link / 1. Physical | **Network Access / Interface Layer** (Ethernet, Token Ring, Frame Relay, ATM, Wi-Fi) |

**Key Differences:**
- **OSI:** 7 layers, horizontal approach, separate Presentation & Session layers, Network layer supports both CO & CL, clearly separates services/interfaces/protocols, general model.
- **TCP/IP:** 4 layers, vertical approach, protocol-driven (less flexible for swapping protocols), Network/Internet layer is connectionless, no separate Presentation/Session layers.
