# Chapter 6: Wide Area Networks (Dr. Ahmed Atwan)

*Source: `01_Dr_Ahmed_Atwan/Chapters_5_to_7_Explained/Ch06_Wide_Area_Networks.pdf` (Book pp. 163–176)*

---

## 1. Metropolitan Area Networks (MAN)
- Covers a geographic area **larger than a LAN** but **smaller than a WAN** (e.g., interconnecting networks across a city or campus).
- Can connect multiple LANs via trunk bridges and provide high-speed connectivity to a WAN (e.g., E.R.P.S. Ring with recovery time `< 50 ms`).

---

## 2. Wide Area Networks (WAN)
- Connects LANs separated by **large geographical distances** using a **Telecommunications Service Provider (TSP)** (telephone companies, cable companies, satellites, network providers).
- **Main Features:**
  1. Covers wide geographic areas beyond LAN capability.
  2. Uses carrier/TSP services.
  3. Uses serial connections for wide-area bandwidth access.

---

## 3. Subnets & WAN Architecture
- **Organizational Subnet:** Dividing a network into subnets (e.g., per building/location) lets an organization share a **single network address** on the Internet and keep internal routing hidden from external Internet gateways.
- **WAN Subnet Components:**
  1. **Transmission media:** Copper, fiber, or radio links (often leased from a telecom provider).
  2. **Switching elements (Routers):** Receive data on an input line and select the appropriate output line.
- **Routing vs. Forwarding:**
  - **Routing algorithm:** Decides which overall path through the network to use.
  - **Forwarding algorithm:** How each router decides where to send a packet next.
- **WAN vs. Wired LAN Differences:**
  1. WAN hosts/subnets are owned and operated by different organizations.
  2. Routers interconnect diverse network technologies.
  3. Different connection mechanisms to the subnet.

---

## 4. VPN & Wireless WANs
- **VPN (Virtual Private Network):** Connects remote offices, home users, and business partners over the **public Internet** with the **security and performance** of a private network (avoids costly dedicated leased lines).
- **Satellite WANs:** Ground antennas send/receive via orbiting satellites; valuable when **broadcast** capability is essential.

---

## 5. MAN / WAN Protocols & Technologies
- **ATM (Asynchronous Transfer Mode):**
  - **Fixed 53-byte packet (cell)** → enables fast, easy switching and multiplexing.
  - **Connection-oriented:** Midway switches are notified of service needs and traffic variables before transmission.
  - Layers: Physical Layer → ATM Layer → ATM Adaptation Layer (AAL).
- **DQDB (Distributed Queue Dual Bus — IEEE 802.6):**
  - Data Link Layer protocol designed for **MANs**.
  - Supports **data, voice, and video** using cell-based switching (like ATM) and SMDS.
  - Sublayers: MAC sublayer (L2_PDU) + LLC sublayer (L3_PDU).
