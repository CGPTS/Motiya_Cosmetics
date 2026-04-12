import { db } from './firebase.js';
import {
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
    query, where, writeBatch, getCountFromServer, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const bySmartName = (a, b) => {
    const aName = String(a.name || a.cabinetNumber || a.id || '');
    const bName = String(b.name || b.cabinetNumber || b.id || '');
    return aName.localeCompare(bName, 'he', { numeric: true, sensitivity: 'base' });
};

async function addAuditLog(action, entityType, entityId, details = {}) {
    try {
        await addDoc(collection(db, "auditLogs"), {
            action,
            entityType,
            entityId,
            details,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Audit log error:', error);
    }
}

// ==================== Sites ====================
export const getSites = async () => {
    const snap = await getDocs(collection(db, "sites"));
    const sites = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return sites.sort(bySmartName);
};

export const addSite = async (data) => {
    const siteRef = await addDoc(collection(db, "sites"), { ...data, createdAt: serverTimestamp() });
    await addAuditLog('create', 'site', siteRef.id, { name: data.name });
    return siteRef;
};

export const updateSite = async (siteId, data) => {
    await updateDoc(doc(db, "sites", siteId), data);
    await addAuditLog('update', 'site', siteId, data);
};

export const deleteSite = async (siteId) => {
    const cabinets = await getCabinets(siteId);
    for (const cab of cabinets) {
        await deleteCabinet(cab.id);
    }
    await deleteDoc(doc(db, "sites", siteId));
    await addAuditLog('delete', 'site', siteId);
};

// ==================== Cabinets ====================
export const getCabinets = async (siteId) => {
    const q = query(collection(db, "cabinets"), where("siteId", "==", siteId));
    const snap = await getDocs(q);
    const cabinets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return cabinets.sort(bySmartName);
};

export const addCabinet = async (data) => {
    const cabinetRef = await addDoc(collection(db, "cabinets"), { ...data, createdAt: serverTimestamp() });
    await addAuditLog('create', 'cabinet', cabinetRef.id, { name: data.name, siteId: data.siteId });
    return cabinetRef;
};

export const updateCabinet = async (cabinetId, data) => {
    await updateDoc(doc(db, "cabinets", cabinetId), data);
    await addAuditLog('update', 'cabinet', cabinetId, data);
};

export const deleteCabinet = async (cabinetId) => {
    const devices = await getDevices(cabinetId);
    for (const dev of devices) {
        await deleteDevice(dev.id);
    }
    await deleteDoc(doc(db, "cabinets", cabinetId));
    await addAuditLog('delete', 'cabinet', cabinetId);
};

// ==================== Devices ====================
export const getDevices = async (cabinetId) => {
    const q = query(collection(db, "devices"), where("cabinetId", "==", cabinetId));
    const snap = await getDocs(q);
    const devices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return devices.sort(bySmartName);
};

export const addDevice = async (data) => {
    const deviceRef = await addDoc(collection(db, "devices"), { ...data, createdAt: serverTimestamp() });

    const portsCount = parseInt(data.portCount, 10) || 0;
    const uplinksCount = parseInt(data.uplinkCount, 10) || 0;
    const totalPorts = portsCount + uplinksCount;

    if (totalPorts > 0) {
        const batch = writeBatch(db);
        for (let i = 1; i <= portsCount; i++) {
            const portRef = doc(collection(db, "ports"));
            batch.set(portRef, {
                deviceId: deviceRef.id,
                portNumber: i,
                portLabel: data.portNaming
                    ? data.portNaming + (data.portStart + i - 1)
                    : String(i),
                portCategory: "access",
                description: "",
                connectedTo: "",
                status: "\u05DC\u05D0 \u05E4\u05E2\u05D9\u05DC",
                vlan: "1",
                speed: "auto",
                mode: "access"
            });
        }
        for (let i = 1; i <= uplinksCount; i++) {
            const portRef = doc(collection(db, "ports"));
            batch.set(portRef, {
                deviceId: deviceRef.id,
                portNumber: portsCount + i,
                portLabel: data.uplinkNaming
                    ? data.uplinkNaming + (data.uplinkStart + i - 1)
                    : `Uplink ${i}`,
                portCategory: "uplink",
                description: "",
                connectedTo: "",
                status: "\u05DC\u05D0 \u05E4\u05E2\u05D9\u05DC",
                vlan: "1",
                speed: "auto",
                mode: "trunk"
            });
        }
        await batch.commit();
    }
    await addAuditLog('create', 'device', deviceRef.id, {
        name: data.name,
        category: data.category,
        portCount: portsCount,
        uplinkCount: uplinksCount
    });
    return deviceRef;
};

export const updateDevice = async (deviceId, data) => {
    await updateDoc(doc(db, "devices", deviceId), data);
    await addAuditLog('update', 'device', deviceId, data);
};

export const updateDevicesBulk = async (deviceIds, data) => {
    if (!Array.isArray(deviceIds) || deviceIds.length === 0) return;
    const batch = writeBatch(db);
    deviceIds.forEach((deviceId) => batch.update(doc(db, "devices", deviceId), data));
    await batch.commit();
    await addAuditLog('bulk-update', 'device', 'multiple', { deviceIds, changes: data });
};

export const deleteDevice = async (deviceId) => {
    const portsQuery = query(collection(db, "ports"), where("deviceId", "==", deviceId));
    const portsSnap = await getDocs(portsQuery);
    const deletes = portsSnap.docs.map(d => deleteDoc(doc(db, "ports", d.id)));
    await Promise.all(deletes);
    await deleteDoc(doc(db, "devices", deviceId));
    await addAuditLog('delete', 'device', deviceId, { portsDeleted: portsSnap.docs.length });
};

// ==================== Ports ====================
export const getPorts = async (deviceId) => {
    const q = query(collection(db, "ports"), where("deviceId", "==", deviceId));
    const snap = await getDocs(q);
    let ports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return ports.sort((a, b) => a.portNumber - b.portNumber);
};

export const updatePort = async (portId, data) => {
    await updateDoc(doc(db, "ports", portId), data);
    await addAuditLog('update', 'port', portId, data);
};

export const updatePortsBulk = async (portIds, data) => {
    if (!Array.isArray(portIds) || portIds.length === 0) return;
    const batch = writeBatch(db);
    portIds.forEach((portId) => {
        batch.update(doc(db, "ports", portId), data);
    });
    await batch.commit();
    await addAuditLog('bulk-update', 'port', 'multiple', { portIds, changes: data });
};


// ==================== Stats ====================
export const getStats = async () => {
    try {
        const [sitesSnap, devicesSnap, portsSnap] = await Promise.all([
            getCountFromServer(collection(db, "sites")),
            getCountFromServer(collection(db, "devices")),
            getCountFromServer(collection(db, "ports"))
        ]);
        const activeQ = query(collection(db, "ports"), where("status", "==", "\u05E4\u05E2\u05D9\u05DC"));
        const activeSnap = await getCountFromServer(activeQ);

        return {
            sites: sitesSnap.data().count,
            devices: devicesSnap.data().count,
            totalPorts: portsSnap.data().count,
            activePorts: activeSnap.data().count
        };
    } catch {
        return { sites: 0, devices: 0, totalPorts: 0, activePorts: 0 };
    }
};

export const getAuditLogs = async (limit = 100) => {
    const snap = await getDocs(collection(db, "auditLogs"));
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return logs
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, limit);
};

export const getInventorySnapshot = async () => {
    const sites = await getSites();
    const cabinetsBySite = new Map();
    const devicesByCabinet = new Map();
    const portsByDevice = new Map();
    const allDevices = [];
    const allPorts = [];

    for (const site of sites) {
        const cabinets = await getCabinets(site.id);
        cabinetsBySite.set(site.id, cabinets);
        for (const cabinet of cabinets) {
            const devices = await getDevices(cabinet.id);
            devicesByCabinet.set(cabinet.id, devices);
            allDevices.push(...devices.map(d => ({ ...d, siteId: site.id, siteName: site.name, cabinetName: cabinet.name })));
            for (const device of devices) {
                const ports = await getPorts(device.id);
                portsByDevice.set(device.id, ports);
                allPorts.push(...ports.map(p => ({
                    ...p,
                    deviceName: device.name,
                    deviceModel: device.model,
                    siteName: site.name,
                    siteId: site.id,
                    cabinetName: cabinet.name,
                    deviceId: device.id
                })));
            }
        }
    }

    return { sites, cabinetsBySite, devicesByCabinet, portsByDevice, allDevices, allPorts };
};

export const subscribeInventory = (onData, onError) => {
    let disposed = false;
    let timer = null;
    let running = false;
    let queued = false;

    const emit = async () => {
        if (disposed || running) {
            queued = true;
            return;
        }
        running = true;
        try {
            const snapshot = await getInventorySnapshot();
            if (!disposed) onData?.(snapshot);
        } catch (error) {
            if (!disposed) onError?.(error);
        } finally {
            running = false;
            if (queued && !disposed) {
                queued = false;
                emit();
            }
        }
    };

    const scheduleEmit = () => {
        clearTimeout(timer);
        timer = setTimeout(emit, 80);
    };

    const unsubscribers = [
        onSnapshot(collection(db, "sites"), scheduleEmit, onError),
        onSnapshot(collection(db, "cabinets"), scheduleEmit, onError),
        onSnapshot(collection(db, "devices"), scheduleEmit, onError),
        onSnapshot(collection(db, "ports"), scheduleEmit, onError)
    ];

    emit();

    return () => {
        disposed = true;
        clearTimeout(timer);
        unsubscribers.forEach((unsub) => {
            try { unsub(); } catch {}
        });
    };
};

export const cleanupAuditLogs = async ({ olderThanDays = null, deleteAll = false } = {}) => {
    const idsToDelete = [];
    if (deleteAll) {
        const all = await getDocs(collection(db, "auditLogs"));
        all.docs.forEach((d) => idsToDelete.push(d.id));
    } else {
        const days = Number(olderThanDays);
        if (!Number.isFinite(days) || days <= 0) return { deleted: 0 };
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const q = query(collection(db, "auditLogs"), where("createdAt", "<=", cutoff));
        const oldSnap = await getDocs(q);
        oldSnap.docs.forEach((d) => idsToDelete.push(d.id));
    }

    let deleted = 0;
    for (let i = 0; i < idsToDelete.length; i += 400) {
        const chunk = idsToDelete.slice(i, i + 400);
        const batch = writeBatch(db);
        chunk.forEach((id) => batch.delete(doc(db, "auditLogs", id)));
        await batch.commit();
        deleted += chunk.length;
    }

    await addAuditLog('cleanup', 'auditLogs', 'multiple', {
        deleted,
        deleteAll: !!deleteAll,
        olderThanDays: deleteAll ? null : olderThanDays
    });
    return { deleted };
};
