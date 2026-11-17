# Chapter 7: Addressing (Dr. Ahmed Atwan)

*Source: `01_Dr_Ahmed_Atwan/Chapters_5_to_7_Explained/Ch07_Addressing.pdf` (Book pp. 177–205)*

---

## 1. MAC Addressing & OUI
- **Ethernet MAC Address:** **48 bits (6 bytes)** total:
  - First **24 bits (3 bytes):** **OUI (Organizationally Unique Identifier)** — purchased from **IEEE**, uniquely identifies the manufacturer/vendor (includes `I/G` and `G/L` bits).
  - Last **24 bits (3 bytes):** Vendor-assigned unique identifier for the device.

---

## 2. IPv4 Addressing Basics
- **32-bit** unique, universal address (`2^32 = 4,294,967,296` addresses).
- **Hierarchy:** **Prefix (Net ID)** identifies the network + **Suffix (Host ID)** identifies the host within that network.
- **Notations:** Binary (32 bits) and **Dotted-Decimal** (4 bytes separated by dots, e.g., `128.11.3.31`).
  - *Valid format rules:* Exactly 4 octets, each `0–255`, no leading zeros (e.g., `045` is invalid), no mixing binary and decimal.
- **Routers & Multi-homed Hosts:** An IP address belongs to an **interface**, not the computer itself; routers have one IP per connected network interface.

---

## 3. Classful Addressing

| Class | Leading Bits | First Octet Range | Default Mask / CIDR | Blocks | Addresses / Block | Use |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | `0...` | `0 – 127` | `255.0.0.0` (`/8`) | 128 | 16,777,216 | Unicast (large nets) |
| **B** | `10...` | `128 – 191` | `255.255.0.0` (`/16`) | 16,384 | 65,536 | Unicast (medium nets) |
| **C** | `110...` | `192 – 223` | `255.255.255.0` (`/24`) | 2,097,152 | 256 | Unicast (small nets) |
| **D** | `1110...` | `224 – 239` | — | 1 | 268,435,456 | **Multicast** |
| **E** | `1111...` | `240 – 255` | — | 1 | 268,435,456 | **Reserved / Research** |

### Special IP Addresses
| Prefix | Suffix | Type | Purpose |
| :--- | :--- | :--- | :--- |
| `all-0s` | `all-0s` | This computer | Used during bootstrap |
| `network` | `all-0s` | Network address | Identifies a network |
| `network` | `all-1s` | Directed broadcast | Broadcast on specified network |
| `all-1s` | `all-1s` | Limited broadcast | Broadcast on local network |
| `127` | `any` | Loopback | Testing |

---

## 4. Classless Addressing (CIDR)
Created to overcome classful address depletion. Written as `x.y.z.t/n` where `n` = mask length (`0–32` consecutive `1`s followed by `0`s).

**3 Block Restrictions:**
1. Addresses in a block must be **contiguous**.
2. Number of addresses in a block must be a **power of 2**.
3. The **first address** must be evenly divisible by the number of addresses.

**Key Formulas for `x.y.z.t/n`:**
- **Number of addresses:** `2^(32 - n)` (or `(~Mask) + 1`).
- **First address (Network ID):** Set rightmost `32 - n` bits to `0` (or `Address AND Mask`).
- **Last address (Broadcast):** Set rightmost `32 - n` bits to `1` (or `Address OR (~Mask)`).
- **Subnetting / ISP Allocation:** If a customer needs `K` addresses, host bits needed = `log2(K)`, so prefix length = `32 - log2(K)`.

---

## 5. NAT (Network Address Translation) & Private IPs
- **Benefits:** Allows many devices on a private network to share a single (or few) public IP(s), conserving IPv4 addresses.
- **Private IPv4 Ranges:**
  - `10.0.0.0 – 10.255.255.255` (`2^24` addresses)
  - `172.16.0.0 – 172.31.255.255` (`2^20` addresses)
  - `192.168.0.0 – 192.168.255.255` (`2^16` addresses)
- **5-Column NAT Translation Table:** `(Private IP, Private Port, External IP, External Port, Transport Protocol)` — maps internal hosts/ports to external connections.

---

## 6. IPv6 Addressing
- **128 bits (16 bytes)** = **32 hexadecimal digits**, written in **Hexadecimal Colon Notation** (8 groups of 4 hex digits).
- **Abbreviation Rules:**
  1. Omit leading zeros in each 4-digit group (e.g., `0074` → `74`, `0000` → `0`).
  2. Replace **one** contiguous sequence of all-zero groups with **`::`** (double colon).
  - *Example:* `0:15::1:12:1213` expands to `0000:0015:0000:0000:0000:0001:0012:1213`.
- **Key Type Prefixes:**
  - `010` → Provider-based unicast (`1/8`)
  - `100` → Geographic-based unicast (`1/8`)
  - `1111 1110 10` → Link-local (`1/1024`)
  - `1111 1110 11` → Site-local (`1/1024`)
  - `1111 1111` → Multicast (`1/256`)
