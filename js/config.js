export const DEVICE_CATEGORIES = {
    switch: {
        label: 'Switch',
        labelHe: 'מתג',
        icon: 'fa-network-wired',
        color: '#10b981',
        hasIp: true,
        hasPorts: true,
        models: [
            { name: 'Catalyst 9200L-24P-4G', ports: 24, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'SFP 1/', uplinkStart: 1, poe: true },
            { name: 'Catalyst 9200L-24P-4X', ports: 24, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: true },
            { name: 'Catalyst 9200L-48P-4G', ports: 48, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'SFP 1/', uplinkStart: 1, poe: true },
            { name: 'Catalyst 9200L-48P-4X', ports: 48, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: true },
            { name: 'Catalyst 9200-24T', ports: 24, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: false },
            { name: 'Catalyst 9200-48T', ports: 48, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: false },
            { name: 'Catalyst 9300-24T', ports: 24, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: false },
            { name: 'Catalyst 9300-24P', ports: 24, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: true },
            { name: 'Catalyst 9300-24U', ports: 24, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: true },
            { name: 'Catalyst 9300-48T', ports: 48, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: false },
            { name: 'Catalyst 9300-48P', ports: 48, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: true },
            { name: 'Catalyst 9300-48U', ports: 48, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: true },
            { name: 'Catalyst 9300L-24T-4G', ports: 24, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: false },
            { name: 'Catalyst 9300L-48T-4G', ports: 48, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: false },
            { name: 'Catalyst 9300L-24P-4G', ports: 24, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: true },
            { name: 'Catalyst 9300L-48P-4G', ports: 48, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: true },
            { name: 'Catalyst 9500-24Y4C', ports: 24, portNaming: 'Twe1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Hu1/0/', uplinkStart: 25, poe: false },
            { name: 'Catalyst 9500-48Y4C', ports: 48, portNaming: 'Twe1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Hu1/0/', uplinkStart: 49, poe: false },
            { name: 'Catalyst 2960-X-24TS-L', ports: 24, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Gi1/0/', uplinkStart: 25, poe: false },
            { name: 'Catalyst 2960-X-48TS-L', ports: 48, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Gi1/0/', uplinkStart: 49, poe: false },
            { name: 'Catalyst 2960-X-24PS-L', ports: 24, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Gi1/0/', uplinkStart: 25, poe: true },
            { name: 'Catalyst 2960-X-48FPS-L', ports: 48, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Gi1/0/', uplinkStart: 49, poe: true },
            { name: 'Catalyst 3850-24T', ports: 24, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: false },
            { name: 'Catalyst 3850-48T', ports: 48, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: false },
            { name: 'Catalyst 3850-24P', ports: 24, portNaming: 'Gi1/0/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/1/', uplinkStart: 1, poe: true },
            { name: 'CBS350-24T-4G', ports: 24, portNaming: 'gi', portStart: 1, uplinks: 4, uplinkNaming: 'gi', uplinkStart: 25, poe: false },
            { name: 'CBS350-48T-4G', ports: 48, portNaming: 'gi', portStart: 1, uplinks: 4, uplinkNaming: 'gi', uplinkStart: 49, poe: false },
            { name: 'CBS350-24P-4G', ports: 24, portNaming: 'gi', portStart: 1, uplinks: 4, uplinkNaming: 'gi', uplinkStart: 25, poe: true },
            { name: 'CBS250-24T-4G', ports: 24, portNaming: 'gi', portStart: 1, uplinks: 4, uplinkNaming: 'gi', uplinkStart: 25, poe: false },
            { name: 'Nexus 9336C-FX2', ports: 36, portNaming: 'Eth1/', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Nexus 93180YC-FX', ports: 48, portNaming: 'Eth1/', portStart: 1, uplinks: 6, uplinkNaming: 'Eth1/', uplinkStart: 49, poe: false },
            { name: 'IE-4000-8GT4G-E', ports: 8, portNaming: 'Gi1/', portStart: 1, uplinks: 4, uplinkNaming: 'Gi1/', uplinkStart: 9, poe: false },
            { name: 'IE-4010-4S24P', ports: 24, portNaming: 'Gi1/', portStart: 1, uplinks: 4, uplinkNaming: 'Te1/', uplinkStart: 1, poe: true },
            { name: 'אחר', ports: 24, portNaming: 'Gi1/0/', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
        ]
    },
    router: {
        label: 'Router',
        labelHe: 'נתב',
        icon: 'fa-globe',
        color: '#3b82f6',
        hasIp: true,
        hasPorts: true,
        models: [
            { name: 'ISR 1100-4G', ports: 4, portNaming: 'Gi0/0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'ISR 1100-4GLTENA', ports: 4, portNaming: 'Gi0/0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'ISR 1100-8P', ports: 8, portNaming: 'Gi0/0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: true },
            { name: 'ISR 4221', ports: 2, portNaming: 'Gi0/0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'ISR 4321', ports: 2, portNaming: 'Gi0/0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'ISR 4331', ports: 3, portNaming: 'Gi0/0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'ISR 4351', ports: 3, portNaming: 'Gi0/0/', portStart: 0, uplinks: 2, uplinkNaming: 'Gi0/1/', uplinkStart: 0, poe: false },
            { name: 'ISR 4431', ports: 4, portNaming: 'Gi0/0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'ISR 4451-X', ports: 4, portNaming: 'Gi0/0/', portStart: 0, uplinks: 2, uplinkNaming: 'Te0/1/', uplinkStart: 0, poe: false },
            { name: 'Catalyst 8200L-1N-4T', ports: 4, portNaming: 'Gi0/0/', portStart: 0, uplinks: 1, uplinkNaming: 'Gi0/1/', uplinkStart: 0, poe: false },
            { name: 'Catalyst 8300-2N2S-6T', ports: 6, portNaming: 'Gi0/0/', portStart: 0, uplinks: 2, uplinkNaming: 'Te0/1/', uplinkStart: 0, poe: false },
            { name: 'Catalyst 8500-12X4QC', ports: 12, portNaming: 'Te0/0/', portStart: 0, uplinks: 4, uplinkNaming: 'Fo0/0/', uplinkStart: 0, poe: false },
            { name: 'ASR 1001-X', ports: 6, portNaming: 'Gi0/', portStart: 0, uplinks: 2, uplinkNaming: 'Te0/', uplinkStart: 0, poe: false },
            { name: 'ASR 1002-HX', ports: 8, portNaming: 'Gi0/', portStart: 0, uplinks: 4, uplinkNaming: 'Te0/', uplinkStart: 0, poe: false },
            { name: 'אחר', ports: 4, portNaming: 'Gi0/0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
        ]
    },
    ap: {
        label: 'Access Point',
        labelHe: 'נקודת גישה',
        icon: 'fa-wifi',
        color: '#f59e0b',
        hasIp: true,
        hasPorts: true,
        models: [
            { name: 'Catalyst 9120AXI', ports: 1, portNaming: 'Gi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Catalyst 9120AXE', ports: 1, portNaming: 'Gi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Catalyst 9130AXI', ports: 2, portNaming: 'mGi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Catalyst 9130AXE', ports: 2, portNaming: 'mGi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Catalyst 9136', ports: 2, portNaming: 'mGi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Catalyst 9162I', ports: 1, portNaming: 'Gi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Catalyst 9164I', ports: 2, portNaming: 'Gi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Catalyst 9166I', ports: 2, portNaming: 'mGi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Catalyst 9178I', ports: 2, portNaming: 'mGi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Meraki MR36', ports: 1, portNaming: 'Gi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Meraki MR46', ports: 1, portNaming: 'mGi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Meraki MR56', ports: 2, portNaming: 'mGi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Aironet 1815i', ports: 1, portNaming: 'Gi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Aironet 2802i', ports: 2, portNaming: 'Gi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Aironet 3802i', ports: 2, portNaming: 'mGi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'אחר', ports: 1, portNaming: 'Gi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
        ]
    },
    firewall: {
        label: 'Firewall',
        labelHe: 'חומת אש',
        icon: 'fa-shield-halved',
        color: '#ef4444',
        hasIp: true,
        hasPorts: true,
        models: [
            { name: 'ASA 5506-X', ports: 8, portNaming: 'Gi1/', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'ASA 5508-X', ports: 8, portNaming: 'Gi1/', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'ASA 5516-X', ports: 8, portNaming: 'Gi1/', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'ASA 5525-X', ports: 8, portNaming: 'Gi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'ASA 5545-X', ports: 8, portNaming: 'Gi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'ASA 5555-X', ports: 8, portNaming: 'Gi0/', portStart: 0, uplinks: 4, uplinkNaming: 'Te0/', uplinkStart: 0, poe: false },
            { name: 'Firepower 1010', ports: 8, portNaming: 'Eth1/', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Firepower 1120', ports: 8, portNaming: 'Eth1/', portStart: 1, uplinks: 4, uplinkNaming: 'Eth1/', uplinkStart: 9, poe: false },
            { name: 'Firepower 1140', ports: 8, portNaming: 'Eth1/', portStart: 1, uplinks: 4, uplinkNaming: 'Eth1/', uplinkStart: 9, poe: false },
            { name: 'Firepower 1150', ports: 8, portNaming: 'Eth1/', portStart: 1, uplinks: 4, uplinkNaming: 'Eth1/', uplinkStart: 9, poe: false },
            { name: 'Firepower 2110', ports: 12, portNaming: 'Eth1/', portStart: 1, uplinks: 4, uplinkNaming: 'SFP1/', uplinkStart: 1, poe: false },
            { name: 'Firepower 2120', ports: 12, portNaming: 'Eth1/', portStart: 1, uplinks: 4, uplinkNaming: 'SFP1/', uplinkStart: 1, poe: false },
            { name: 'Firepower 2130', ports: 12, portNaming: 'Eth1/', portStart: 1, uplinks: 4, uplinkNaming: 'SFP+1/', uplinkStart: 1, poe: false },
            { name: 'Firepower 2140', ports: 12, portNaming: 'Eth1/', portStart: 1, uplinks: 4, uplinkNaming: 'SFP+1/', uplinkStart: 1, poe: false },
            { name: 'Firepower 4110', ports: 8, portNaming: 'Eth1/', portStart: 1, uplinks: 8, uplinkNaming: 'SFP+1/', uplinkStart: 1, poe: false },
            { name: 'Firepower 4120', ports: 8, portNaming: 'Eth1/', portStart: 1, uplinks: 8, uplinkNaming: 'SFP+1/', uplinkStart: 1, poe: false },
            { name: 'Secure Firewall 3110', ports: 8, portNaming: 'Eth1/', portStart: 1, uplinks: 4, uplinkNaming: 'SFP+1/', uplinkStart: 1, poe: false },
            { name: 'Secure Firewall 3120', ports: 8, portNaming: 'Eth1/', portStart: 1, uplinks: 8, uplinkNaming: 'SFP+1/', uplinkStart: 1, poe: false },
            { name: 'אחר', ports: 8, portNaming: 'Eth1/', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
        ]
    },
    wlc: {
        label: 'WLC',
        labelHe: 'בקר אלחוטי',
        icon: 'fa-tower-broadcast',
        color: '#8b5cf6',
        hasIp: true,
        hasPorts: true,
        models: [
            { name: 'Catalyst 9800-L', ports: 2, portNaming: 'Gi0/', portStart: 0, uplinks: 2, uplinkNaming: 'Te0/', uplinkStart: 0, poe: false },
            { name: 'Catalyst 9800-40', ports: 2, portNaming: 'Gi0/', portStart: 0, uplinks: 4, uplinkNaming: 'Te0/', uplinkStart: 0, poe: false },
            { name: 'Catalyst 9800-80', ports: 2, portNaming: 'Gi0/', portStart: 0, uplinks: 4, uplinkNaming: 'Te0/', uplinkStart: 0, poe: false },
            { name: 'Catalyst 9800-CL (Virtual)', ports: 0, portNaming: '', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'WLC 3504', ports: 2, portNaming: 'SP/', portStart: 1, uplinks: 4, uplinkNaming: 'DP/', uplinkStart: 1, poe: false },
            { name: 'WLC 5520', ports: 2, portNaming: 'SP/', portStart: 1, uplinks: 8, uplinkNaming: 'DP/', uplinkStart: 1, poe: false },
            { name: 'WLC 8540', ports: 2, portNaming: 'SP/', portStart: 1, uplinks: 8, uplinkNaming: 'DP/', uplinkStart: 1, poe: false },
            { name: 'Embedded WLC (9300)', ports: 0, portNaming: '', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'אחר', ports: 2, portNaming: 'Gi0/', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
        ]
    },
    phone: {
        label: 'IP Phone',
        labelHe: 'טלפון IP',
        icon: 'fa-phone',
        color: '#06b6d4',
        hasIp: true,
        hasPorts: true,
        models: [
            { name: 'IP Phone 7821', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'IP Phone 7841', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'IP Phone 7861', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'IP Phone 8841', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'IP Phone 8845', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'IP Phone 8851', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'IP Phone 8861', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'IP Phone 8865', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Webex Desk', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Webex Room Kit', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Webex Board 55', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'אחר', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
        ]
    },
    server: {
        label: 'Server',
        labelHe: 'שרת',
        icon: 'fa-server',
        color: '#64748b',
        hasIp: true,
        hasPorts: true,
        models: [
            { name: 'UCS C220 M6', ports: 2, portNaming: 'NIC', portStart: 1, uplinks: 2, uplinkNaming: 'SFP+', uplinkStart: 1, poe: false },
            { name: 'UCS C240 M6', ports: 2, portNaming: 'NIC', portStart: 1, uplinks: 4, uplinkNaming: 'SFP+', uplinkStart: 1, poe: false },
            { name: 'UCS C220 M7', ports: 2, portNaming: 'NIC', portStart: 1, uplinks: 2, uplinkNaming: 'SFP+', uplinkStart: 1, poe: false },
            { name: 'UCS C240 M7', ports: 2, portNaming: 'NIC', portStart: 1, uplinks: 4, uplinkNaming: 'SFP+', uplinkStart: 1, poe: false },
            { name: 'UCS C245 M6', ports: 2, portNaming: 'NIC', portStart: 1, uplinks: 2, uplinkNaming: 'SFP+', uplinkStart: 1, poe: false },
            { name: 'HyperFlex HX220c M6', ports: 2, portNaming: 'NIC', portStart: 1, uplinks: 2, uplinkNaming: 'SFP+', uplinkStart: 1, poe: false },
            { name: 'שרת כללי', ports: 4, portNaming: 'Eth', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'אחר', ports: 2, portNaming: 'NIC', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
        ]
    },
    patchPanel: {
        label: 'Patch Panel',
        labelHe: 'פאנל תקשורת',
        icon: 'fa-grip-lines',
        color: '#78716c',
        hasIp: false,
        hasPorts: true,
        models: [
            { name: 'Patch Panel Cat5e 24P', ports: 24, portNaming: '', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Patch Panel Cat5e 48P', ports: 48, portNaming: '', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Patch Panel Cat6 24P', ports: 24, portNaming: '', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Patch Panel Cat6 48P', ports: 48, portNaming: '', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Patch Panel Cat6A 24P', ports: 24, portNaming: '', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Patch Panel Cat6A 48P', ports: 48, portNaming: '', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Fiber Patch Panel 12P', ports: 12, portNaming: 'FO-', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Fiber Patch Panel 24P', ports: 24, portNaming: 'FO-', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Fiber Patch Panel 48P', ports: 48, portNaming: 'FO-', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'אחר', ports: 24, portNaming: '', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
        ]
    },
    ups: {
        label: 'UPS',
        labelHe: 'אל-פסק',
        icon: 'fa-car-battery',
        color: '#eab308',
        hasIp: false,
        hasPorts: false,
        models: [
            { name: 'APC Smart-UPS 750', ports: 0, portNaming: '', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'APC Smart-UPS 1500', ports: 0, portNaming: '', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'APC Smart-UPS 2200', ports: 0, portNaming: '', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'APC Smart-UPS 3000', ports: 0, portNaming: '', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'APC Smart-UPS 5000', ports: 0, portNaming: '', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Eaton 5PX 1500', ports: 0, portNaming: '', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Eaton 5PX 2200', ports: 0, portNaming: '', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Eaton 5PX 3000', ports: 0, portNaming: '', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Eaton 9PX 6000', ports: 0, portNaming: '', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'אחר', ports: 0, portNaming: '', portStart: 0, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
        ]
    },
    converter: {
        label: 'Media Converter',
        labelHe: 'ממיר מדיה',
        icon: 'fa-shuffle',
        color: '#d946ef',
        hasIp: false,
        hasPorts: true,
        models: [
            { name: 'Fiber-Copper GE', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'Fiber-Copper FE', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'SFP-RJ45 GE', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'SFP-RJ45 10GE', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'PoE Injector', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: true },
            { name: 'PoE Splitter', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
            { name: 'אחר', ports: 2, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
        ]
    },
    other: {
        label: 'Other',
        labelHe: 'אחר',
        icon: 'fa-cube',
        color: '#a1a1aa',
        hasIp: true,
        hasPorts: true,
        models: [
            { name: 'ציוד כללי', ports: 0, portNaming: 'Port', portStart: 1, uplinks: 0, uplinkNaming: '', uplinkStart: 0, poe: false },
        ]
    }
};

export const PORT_PROFILES = {
    accessData: {
        key: 'accessData',
        label: 'Access Data',
        mode: 'access',
        vlan: '10',
        speed: 'auto',
        status: 'פעיל',
        portCategory: 'access',
        descriptionPrefix: 'DATA'
    },
    accessVoice: {
        key: 'accessVoice',
        label: 'Access Voice',
        mode: 'access',
        vlan: '20',
        speed: 'auto',
        status: 'פעיל',
        portCategory: 'access',
        descriptionPrefix: 'VOICE'
    },
    trunkUplink: {
        key: 'trunkUplink',
        label: 'Trunk Uplink',
        mode: 'trunk',
        vlan: '10,20,30',
        speed: '1000',
        status: 'פעיל',
        portCategory: 'uplink',
        descriptionPrefix: 'UPLINK'
    },
    disabled: {
        key: 'disabled',
        label: 'Disabled',
        mode: 'access',
        vlan: '1',
        speed: 'auto',
        status: 'לא פעיל',
        portCategory: 'access',
        descriptionPrefix: 'SHUT'
    }
};

export function getPortProfile(profileKey) {
    return PORT_PROFILES[profileKey] || null;
}

export function getCategoryConfig(key) {
    return DEVICE_CATEGORIES[key] || DEVICE_CATEGORIES.other;
}

export function getModelConfig(categoryKey, modelName) {
    const cat = getCategoryConfig(categoryKey);
    return cat.models.find(m => m.name === modelName) || cat.models[cat.models.length - 1];
}

export function generatePortLabel(naming, start, portNumber) {
    if (!naming) return String(start + portNumber - 1);
    return naming + (start + portNumber - 1);
}

export function getCategoryForDevice(device) {
    if (device.category && DEVICE_CATEGORIES[device.category]) {
        return device.category;
    }
    const typeMap = { 'Switch': 'switch', 'Router': 'router', 'Firewall': 'firewall' };
    return typeMap[device.type] || 'other';
}

export function getCategoryIcon(categoryKey) {
    const cat = getCategoryConfig(categoryKey);
    return `<i class="fas ${cat.icon}" style="color:${cat.color}"></i>`;
}

export function getCategoryBadge(categoryKey) {
    const cat = getCategoryConfig(categoryKey);
    return `<span class="device-badge" style="background:${cat.color}20;color:${cat.color};border:1px solid ${cat.color}40">${cat.labelHe}</span>`;
}
