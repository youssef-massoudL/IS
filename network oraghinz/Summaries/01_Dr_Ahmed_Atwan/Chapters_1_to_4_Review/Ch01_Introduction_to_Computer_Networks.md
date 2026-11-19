# Chapter 1: Introduction to Computer Networks (Dr. Ahmed Atwan)

*Source: `01_Dr_Ahmed_Atwan/Chapters_1_to_4_Review/Ch01_Introduction_to_Computer_Networks.pdf` (Book pp. 3–21)*  
*Note: Chapters 1–4 are review material and are included in the exam.*

---

## 1. Network History (Key Milestones)
- **1960s:** Paul Baran & Donald Davies independently developed **packet switching**; Norman Abramson developed **ALOHA** (Univ. of Hawaii, Upload: 407 MHz, Download: 413 MHz).
- **1965:** Western Electric introduced the first widely used phone switch for computer control.
- **1966:** Thomas Marill & Lawrence G. Roberts published an experimental WAN for time sharing.
- **1969:** **ARPANET** first 4 nodes connected via 50 kbps links (UCLA, SRI, UCSB, Univ. of Utah).
- **1972:** Commercial services using **X.25** introduced (later used for expanding TCP/IP).
- **1973–1979:** Robert Metcalfe & David Boggs developed **Ethernet** at Xerox PARC (based on ALOHA); pursued as an open standard in 1979; later scaled from 10 Mbps to 100 Mbps (1995) and Gigabit speeds.
- **1976:** John Murphy established **ARCNET** (token-passing network for sharing storage devices).

---

## 2. Definition & Core Requirements
A **computer network** is a group of interconnected electronic devices that share resources and services through communication links (copper, optical fiber, wireless, radio).

**3 Essential Components:**
1. **Resources** to share.
2. **Transport path** (physical/wireless medium supporting data transmission).
3. **Protocols** (communication policies and rules so sender and receiver recognize and understand each other).

---

## 3. Benefits of Computer Networks
- **File Sharing:** Direct access to files over the network without physical media (CD/USB).
- **Security:** Password-protected folders and restricted access for authorized users.
- **Resource Sharing:** Sharing hardware like printers and scanners.
- **Communication:** Email, VoIP, audio/video conferencing.
- **Flexible Access & Workgroups:** Multiple users collaborating simultaneously on projects/documents (e.g., centralized data consistency, error reduction).

---

## 4. Key Factors in Studying a Computer Network
- **Node nature:** Homogeneous vs. heterogeneous.
- **Topology & Reliability.**
- **Channel capacity allocation:** Time Division (TDM) vs. Frequency Division (FDM).
- **Routing techniques.**
- **Models:** Analytical models, queue simulation models, validation.
- **Access:** Direct vs. through a sub-network.
- **Protocols, standards, and formats** + **Network performance**.

---

## 5. Network Models & Application Fields

| Model | How It Works | Examples |
| :--- | :--- | :--- |
| **Client-Server** | Powerful central **server** stores data/services; **clients** send requests and receive replies. | Web/database apps, email, business systems, VPNs for remote offices |
| **Peer-to-Peer (P2P)** | No fixed clients or servers; each peer communicates directly and manages local data. | BitTorrent / file sharing |

### Application Areas
- **Business:** Resource/printer sharing, remote database access via **VPN**, **VoIP** (IP telephony), video/audio conferencing.
- **Home:** Web browsing, online libraries, audio/video streaming, social networks, collaborative sites (Wikipedia), e-commerce, smart homes (sensors).
- **Mobile Users:** Laptops, phones, fleet tracking, **IEEE 802.11** wireless LAN access points (Wi-Fi) in public/mobile environments. *(Note: wireless and mobile are related but distinct—wired is common in fixed offices/homes, wireless adds mobility/convenience).*
