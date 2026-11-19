# Chapter 1: Introduction (Dr. Mahfouz)

*Source: `02_Dr_Mahfouz/Ch01_Introduction_Full.pdf` (Kurose & Ross, 8th ed. — 84 slides, full chapter)*

---

## 1. What Is the Internet?
- **"Nuts and bolts" view:** Billions of connected computing devices (**hosts / end systems**), **communication links** (fiber, copper, radio, satellite; transmission rate = **bandwidth**), and **packet switches** (**routers**, **switches**) interconnected as a **"network of networks"** (ISPs).
  - Governed by **protocols** (e.g., HTTP, TCP, IP, WiFi, 4G/5G, Ethernet).
  - Standards developed by **IETF** via **RFC** documents.
- **"Services" view:** Infrastructure providing services to distributed applications (Web, streaming, email, games) via a **socket programming interface** ("hooks").
- **Protocol definition:** Defines the **format** and **order** of messages sent/received among network entities, and the **actions taken** on message transmission/receipt.

---

## 2. Network Edge: Hosts, Access Networks & Physical Media
- **Network Edge:** Clients & servers (servers often in data centers).
- **Access Networks:**
  - **Cable (HFC - Hybrid Fiber Coax):** Shared access network using **FDM** (TV & data on different frequency bands); asymmetric (`40 Mbps–1.2 Gbps` down, `30–100 Mbps` up); uses cable modem & **CMTS**.
  - **DSL (Digital Subscriber Line):** Dedicated telephone line to central office **DSLAM**; voice & data on different frequencies; `24–52 Mbps` down, `3.5–16 Mbps` up.
  - **Home Networks:** Cable/DSL modem + router/firewall/NAT + wired Ethernet (1 Gbps) + WiFi AP.
  - **Wireless Access:** **WLANs (WiFi / IEEE 802.11b/g/n)** (`11, 54, 450 Mbps`, ~100 ft) and **Wide-Area Cellular (4G/5G)** (10s of Mbps over 10s of km).
  - **Enterprise & Data Center Networks:** Ethernet (`100 Mbps–10 Gbps`), WiFi, and `10s–100s Gbps` data center links.
- **Physical Media:**
  - **Guided:** Twisted pair (Cat 5: 100 Mbps/1 Gbps; Cat 6: 10 Gbps), Coaxial (broadband, bidirectional), Fiber optic (light pulses, `10s–100s Gbps`, low error rate, immune to EM noise).
  - **Unguided (Wireless Radio):** Half-duplex broadcast; affected by reflection, obstruction, interference. Includes WiFi, 4G/5G, Bluetooth, terrestrial microwave (45 Mbps), satellite (Starlink `< 100 Mbps`, geostationary ~270 ms delay).

---

## 3. Network Core: Switching & Internet Structure
- **Two Core Functions:**
  1. **Forwarding (Switching):** *Local* action — moving an arriving packet from a router's input link to the appropriate output link using a **local forwarding table**.
  2. **Routing:** *Global* action — determining end-to-end source-destination paths using **routing algorithms**.
- **Packet Switching:**
  - **Store-and-forward:** Entire packet of length `L` bits must arrive at router before transmission on next link at rate `R` bps. One-hop transmission delay = `L / R`.
  - **Queueing & Loss:** If arrival rate > link transmission rate `R`, packets queue in router **buffer**; if buffer fills up, packets are **dropped (lost)**.
- **Circuit Switching:**
  - Dedicated end-to-end resources reserved per "call" (no sharing; idle if unused). Multiplexed via **FDM** (frequency bands) or **TDM** (time slots).
  - **Packet vs. Circuit Switching:** Packet switching is better for **bursty** data (resource sharing, no call setup; e.g., 35 users on 1 Gbps link vs. only 10 users in circuit switching), though congestion/loss is possible.
- **Internet Structure ("Network of Networks"):**
  - Access ISPs → Regional ISPs → **Tier-1 commercial ISPs** (global coverage), connected via **peering links** and **IXPs (Internet Exchange Points)**.
  - **Content Provider Networks** (e.g., Google, Microsoft, Facebook) run private networks bypassing Tier-1/regional ISPs to bring content close to users.

---

## 4. Performance: Delay, Loss & Throughput
- **4 Sources of Nodal Delay:**
  $$d_{\text{nodal}} = d_{\text{proc}} + d_{\text{queue}} + d_{\text{trans}} + d_{\text{prop}}$$
  1. $d_{\text{proc}}$ (**Nodal processing**): Check bit errors, determine output link (`< μs`).
  2. $d_{\text{queue}}$ (**Queueing delay**): Time waiting in buffer; depends on **traffic intensity** $La/R$ ($La/R \to 1 \Rightarrow$ large delay; $La/R > 1 \Rightarrow \infty$).
  3. $d_{\text{trans}}$ (**Transmission delay**): $L / R$ (time to push $L$-bit packet onto link at rate $R$).
  4. $d_{\text{prop}}$ (**Propagation delay**): $d / s$ (distance $d$ divided by propagation speed $s \approx 2 \times 10^8\text{ m/s}$).
- **`traceroute`:** Sends 3 probes per hop with increasing `TTL = i` to measure round-trip delays along the path (`* * *` = no reply/lost probe).
- **Packet Loss:** Occurs when a packet arrives at a full buffer.
- **Throughput:** Rate (bits/sec) of bit delivery; constrained by the **bottleneck link**: $\min(R_s, R_c)$, or $\min(R_s, R_c, R/N)$ when $N$ connections share a backbone link $R$.

---

## 5. Network Security
- **Attacks:**
  - **Packet sniffing:** Promiscuous NIC reads/records packets on shared/wireless media (e.g., Wireshark).
  - **IP spoofing:** Injecting packets with a fake source IP address.
  - **DoS (Denial of Service):** Overwhelming a target (often via a **botnet**) with bogus traffic.
- **Defenses:** Authentication, confidentiality (encryption), integrity checks (digital signatures), access restrictions (VPNs), **firewalls** (filtering middleboxes).

---

## 6. Protocol Layers & Encapsulation
- **5-Layer Internet Protocol Stack:**
  1. **Application** (message `M`) — HTTP, IMAP, SMTP, DNS
  2. **Transport** (segment `[Ht | M]`) — TCP, UDP
  3. **Network** (datagram `[Hn | Ht | M]`) — IP, routing protocols
  4. **Link** (frame `[Hl | Hn | Ht | M]`) — Ethernet, 802.11 (WiFi), PPP
  5. **Physical** — bits "on the wire"
- **Encapsulation:** Each layer adds its own header going down the stack and strips it going up.
- **OSI vs. Internet Stack:** OSI has 7 layers; **Presentation** and **Session** are *not* separate in the Internet stack (implemented in the Application layer if needed).

---

## 7. Internet History (Highlights)
- **1961–1972:** Kleinrock (queueing theory), Baran (packet switching), **ARPAnet** first node (1969), **NCP** & first email (1972).
- **1972–1980:** ALOHAnet (1970), Cerf & Kahn internetworking architecture (1974), Ethernet (1976).
- **1980–1990:** **TCP/IP** deployed (1983), SMTP (1982), **DNS** (1983), FTP (1985), TCP congestion control (1988).
- **1990s–Present:** Web (HTML/HTTP by Berners-Lee), Mosaic/Netscape, commercialization, P2P, broadband, **SDN** (2008), 4G/5G, cloud (AWS/Azure), ~15B devices (2023).
