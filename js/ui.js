import * as api from './api.js';
import {
    DEVICE_CATEGORIES, getCategoryConfig, getCategoryForDevice,
    getCategoryBadge, PORT_PROFILES, getPortProfile
} from './config.js';

const hierarchyContainer = document.getElementById('hierarchy-container');
const statsSection = document.getElementById('stats-section');
const modal = document.getElementById('form-modal');
const confirmModal = document.getElementById('confirm-modal');
const modalTitle = document.getElementById('modal-title');
const formFields = document.getElementById('form-fields');
const dynamicForm = document.getElementById('dynamic-form');
const toastContainer = document.getElementById('toast-container');

let currentSubmitAction = null;
let confirmCallback = null;
let activePortTooltip = null;
let liveSnapshotCache = null;
const viewState = {
    mode: 'tree',
    search: '',
    siteId: 'all',
    category: 'all',
    portStatus: 'all'
};

// =============================================
// Toast Notifications
// =============================================
export function showToast(message, type = 'success') {
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =============================================
// Stats
// =============================================
export async function renderStats() {
    try {
        const snapshot = liveSnapshotCache || await api.getInventorySnapshot();
        const sitesCount = snapshot.sites.length;
        const devicesCount = snapshot.allDevices.length;
        const totalPorts = snapshot.allPorts.length;
        const activePorts = snapshot.allPorts.filter(p => p.status === 'פעיל').length;
        const inactive = totalPorts - activePorts;
        const uplinksDown = snapshot.allPorts.filter(p => p.portCategory === 'uplink' && p.status !== 'פעיל').length;
        const staleDevices = snapshot.allDevices.filter(d => !d.ip || !d.model).length;
        statsSection.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6"><i class="fas fa-building"></i></div>
                <div class="stat-info"><div class="stat-value">${sitesCount}</div><div class="stat-label">אתרים</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:rgba(29,78,216,0.14);color:#60a5fa"><i class="fas fa-microchip"></i></div>
                <div class="stat-info"><div class="stat-value">${devicesCount}</div><div class="stat-label">התקנים</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:rgba(16,185,129,0.12);color:#10b981"><i class="fas fa-circle-check"></i></div>
                <div class="stat-info"><div class="stat-value">${activePorts}</div><div class="stat-label">פורטים פעילים</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444"><i class="fas fa-circle-xmark"></i></div>
                <div class="stat-info"><div class="stat-value">${inactive}</div><div class="stat-label">פורטים כבויים</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b"><i class="fas fa-triangle-exclamation"></i></div>
                <div class="stat-info"><div class="stat-value">${uplinksDown}</div><div class="stat-label">Uplinks לא פעילים</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:rgba(56,189,248,0.14);color:#38bdf8"><i class="fas fa-magnifying-glass-chart"></i></div>
                <div class="stat-info"><div class="stat-value">${staleDevices}</div><div class="stat-label">רכיבים עם מידע חסר</div></div>
            </div>`;
    } catch (e) {
        console.error('Stats error:', e);
    }
}

// =============================================
// Tree Rendering
// =============================================
export async function renderTree() {
    try {
        const expandedSet = viewState.mode === 'tree' ? captureExpandedTreeState() : new Set();
        if (!liveSnapshotCache) {
            hierarchyContainer.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>טוען נתונים...</p></div>';
        }
        const snapshot = liveSnapshotCache || await api.getInventorySnapshot();
        hierarchyContainer.innerHTML = '';
        renderWorkspaceControls(snapshot);

        const workspaceBody = document.createElement('div');
        workspaceBody.className = 'workspace-body';
        hierarchyContainer.appendChild(workspaceBody);

        if (snapshot.sites.length === 0) {
            workspaceBody.innerHTML = '<div class="empty-state"><i class="fas fa-building"></i><p>אין אתרים במערכת. לחץ "אתר חדש" להתחיל.</p></div>';
            return;
        }

        if (viewState.mode === 'devices') {
            renderDevicesWorkspace(snapshot, workspaceBody);
            return;
        }
        if (viewState.mode === 'ports') {
            renderPortsWorkspace(snapshot, workspaceBody);
            return;
        }
        renderHierarchyWorkspace(snapshot, workspaceBody, expandedSet);
    } catch (e) {
        console.error('Tree render error:', e);
        hierarchyContainer.innerHTML = '<div class="empty-state"><i class="fas fa-triangle-exclamation"></i><p>שגיאה בטעינת נתונים</p></div>';
    }
}

export function setLiveSnapshot(snapshot) {
    liveSnapshotCache = snapshot;
    renderTree();
    renderStats();
}

function nodeKey(type, id) {
    return `${type}:${id}`;
}

function setExpandedState(expandedSet, key, expanded) {
    if (!expandedSet || !key) return;
    if (expanded) expandedSet.add(key);
    else expandedSet.delete(key);
}

function captureExpandedTreeState() {
    const expanded = new Set();
    const nodes = hierarchyContainer.querySelectorAll('.tree-node[data-type][data-id]');
    nodes.forEach((node) => {
        const chevron = node.querySelector(':scope > .node-header .node-chevron');
        if (chevron?.classList.contains('expanded')) {
            expanded.add(nodeKey(node.dataset.type, node.dataset.id));
        }
    });
    return expanded;
}

async function fillSiteChildren(children, siteId, snapshot, expandedSet) {
    children.innerHTML = miniLoader();
    const cabinets = snapshot?.cabinetsBySite?.get(siteId) || await api.getCabinets(siteId);
    children.innerHTML = '';
    if (!cabinets.length) {
        children.innerHTML = emptyMsg('אין ארונות באתר זה');
        return;
    }
    cabinets.forEach((cab) => children.appendChild(createCabinetNode(cab, siteId, snapshot, expandedSet)));
}

async function fillCabinetChildren(children, cabinetId, snapshot, expandedSet) {
    children.innerHTML = miniLoader();
    const devices = snapshot?.devicesByCabinet?.get(cabinetId) || await api.getDevices(cabinetId);
    children.innerHTML = '';
    if (!devices.length) {
        children.innerHTML = emptyMsg('אין ציוד בארון זה');
        return;
    }
    devices.forEach((dev) => children.appendChild(createDeviceNode(dev, cabinetId, snapshot, expandedSet)));
}

async function fillDevicePorts(container, device, snapshot) {
    container.innerHTML = miniLoader();
    const ports = snapshot?.portsByDevice?.get(device.id) || await api.getPorts(device.id);
    renderPorts(ports, container, device);
}

export function setSearchTerm(term) {
    viewState.search = (term || '').trim().toLowerCase();
    renderTree();
}

export function setViewMode(mode) {
    viewState.mode = mode;
    renderTree();
}

function renderWorkspaceControls(snapshot) {
    const controls = document.createElement('div');
    controls.className = 'workspace-controls';
    const siteOptions = ['<option value="all">כל האתרים</option>']
        .concat(snapshot.sites.map(s => `<option value="${s.id}" ${viewState.siteId === s.id ? 'selected' : ''}>${esc(s.name)}</option>`))
        .join('');
    const catOptions = ['<option value="all">כל הקטגוריות</option>']
        .concat(Object.entries(DEVICE_CATEGORIES).map(([k, c]) => `<option value="${k}" ${viewState.category === k ? 'selected' : ''}>${esc(c.labelHe)}</option>`))
        .join('');

    controls.innerHTML = `
        <div class="workspace-view-tabs">
            <button type="button" class="btn-secondary btn-sm ${viewState.mode === 'tree' ? 'active' : ''}" data-mode="tree">Tree</button>
            <button type="button" class="btn-secondary btn-sm ${viewState.mode === 'devices' ? 'active' : ''}" data-mode="devices">Devices</button>
            <button type="button" class="btn-secondary btn-sm ${viewState.mode === 'ports' ? 'active' : ''}" data-mode="ports">Ports</button>
            <button type="button" class="btn-ghost btn-sm" data-mode="audit"><i class="fas fa-clock-rotate-left"></i> Activity</button>
        </div>
        <div class="workspace-filters">
            <select id="workspace-site-filter">${siteOptions}</select>
            <select id="workspace-category-filter">${catOptions}</select>
            <select id="workspace-status-filter">
                <option value="all" ${viewState.portStatus === 'all' ? 'selected' : ''}>כל הסטטוסים</option>
                <option value="פעיל" ${viewState.portStatus === 'פעיל' ? 'selected' : ''}>פעיל</option>
                <option value="לא פעיל" ${viewState.portStatus === 'לא פעיל' ? 'selected' : ''}>לא פעיל</option>
            </select>
        </div>
    `;
    hierarchyContainer.appendChild(controls);

    controls.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.mode === 'audit') {
                openForm('auditTrail');
                return;
            }
            setViewMode(btn.dataset.mode);
        });
    });
    controls.querySelector('#workspace-site-filter')?.addEventListener('change', (e) => {
        viewState.siteId = e.target.value;
        renderTree();
    });
    controls.querySelector('#workspace-category-filter')?.addEventListener('change', (e) => {
        viewState.category = e.target.value;
        renderTree();
    });
    controls.querySelector('#workspace-status-filter')?.addEventListener('change', (e) => {
        viewState.portStatus = e.target.value;
        renderTree();
    });
}

function filterByViewStateDevice(device) {
    if (viewState.siteId !== 'all' && device.siteId !== viewState.siteId) return false;
    if (viewState.category !== 'all' && getCategoryForDevice(device) !== viewState.category) return false;
    const searchable = `${device.name || ''} ${device.ip || ''} ${device.model || ''} ${device.siteName || ''} ${device.cabinetName || ''}`.toLowerCase();
    if (viewState.search && !searchable.includes(viewState.search)) return false;
    return true;
}

function filterByViewStatePort(port) {
    if (viewState.siteId !== 'all' && port.siteId !== viewState.siteId) return false;
    if (viewState.portStatus !== 'all' && (port.status || 'לא פעיל') !== viewState.portStatus) return false;
    const searchable = `${port.deviceName || ''} ${port.siteName || ''} ${port.cabinetName || ''} ${port.portLabel || ''} ${port.vlan || ''}`.toLowerCase();
    if (viewState.search && !searchable.includes(viewState.search)) return false;
    return true;
}

function renderHierarchyWorkspace(snapshot, container, expandedSet = new Set()) {
    const sites = snapshot.sites
        .filter(site => viewState.siteId === 'all' || site.id === viewState.siteId)
        .filter(site => {
            if (!viewState.search) return true;
            return (`${site.name || ''} ${site.address || ''} ${site.contactPerson || ''}`).toLowerCase().includes(viewState.search);
        });
    if (!sites.length) {
        container.innerHTML = emptyMsg('לא נמצאו תוצאות לתצוגת עץ');
        return;
    }
    sites.forEach(site => container.appendChild(createSiteNode(site, snapshot, expandedSet)));
    if (viewState.search) applySearchToTree(viewState.search, container);
}

function renderDevicesWorkspace(snapshot, container) {
    const devices = snapshot.allDevices.filter(filterByViewStateDevice);
    if (!devices.length) {
        container.innerHTML = emptyMsg('לא נמצאו רכיבים לפילטר שנבחר');
        return;
    }
    const selectedDevices = new Set();
    const toolbar = document.createElement('div');
    toolbar.className = 'ports-toolbar';
    toolbar.innerHTML = `
        <div class="ports-toolbar-title">Device Workspace (${devices.length})</div>
        <div class="ports-toolbar-actions">
            <button class="btn-secondary btn-sm" data-action="select-all">בחר הכל</button>
            <button class="btn-secondary btn-sm" data-action="clear">נקה</button>
            <button class="btn-primary btn-sm" data-action="bulk-edit">Bulk Edit (0)</button>
        </div>
    `;
    container.appendChild(toolbar);
    const grid = document.createElement('div');
    grid.className = 'devices-workspace-grid';
    const updateCount = () => {
        toolbar.querySelector('[data-action="bulk-edit"]').textContent = `Bulk Edit (${selectedDevices.size})`;
        grid.querySelectorAll('.device-workspace-card').forEach((card) => {
            card.classList.toggle('selected', selectedDevices.has(card.dataset.deviceId));
        });
    };
    devices.forEach((dev) => {
        const catKey = getCategoryForDevice(dev);
        const cat = getCategoryConfig(catKey);
        const card = document.createElement('div');
        card.className = 'device-workspace-card';
        card.dataset.deviceId = dev.id;
        card.innerHTML = `
            <div class="device-workspace-head">
                <span class="device-badge" style="background:${cat.color}20;color:${cat.color};border:1px solid ${cat.color}40">${esc(cat.labelHe)}</span>
                <span class="device-workspace-site">${esc(dev.siteName || '')} / ${esc(dev.cabinetName || '')}</span>
            </div>
            <div class="device-workspace-name">${esc(dev.name || 'ללא שם')}</div>
            <div class="device-workspace-meta">${esc(dev.ip || '-')} | ${esc(dev.model || '-')}</div>
            <div class="device-workspace-actions">
                <button type="button" class="btn-secondary btn-sm" data-action="select">בחר</button>
                <button type="button" class="btn-secondary btn-sm" data-action="edit">ערוך</button>
                <button type="button" class="btn-primary btn-sm" data-action="ports">פורטים</button>
            </div>
        `;
        card.querySelector('[data-action="select"]')?.addEventListener('click', () => {
            if (selectedDevices.has(dev.id)) selectedDevices.delete(dev.id);
            else selectedDevices.add(dev.id);
            updateCount();
        });
        card.querySelector('[data-action="edit"]')?.addEventListener('click', () => openForm('editDevice', dev));
        card.querySelector('[data-action="ports"]')?.addEventListener('click', () => {
            viewState.mode = 'ports';
            viewState.search = dev.name.toLowerCase();
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.value = dev.name;
            renderTree();
        });
        grid.appendChild(card);
    });
    container.appendChild(grid);
    toolbar.querySelector('[data-action="select-all"]')?.addEventListener('click', () => {
        selectedDevices.clear();
        devices.forEach(d => selectedDevices.add(d.id));
        updateCount();
    });
    toolbar.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
        selectedDevices.clear();
        updateCount();
    });
    toolbar.querySelector('[data-action="bulk-edit"]')?.addEventListener('click', () => {
        const list = devices.filter(d => selectedDevices.has(d.id));
        if (!list.length) {
            showToast('בחר רכיבים לפני Bulk Edit', 'warning');
            return;
        }
        openForm('bulkEditDevices', { devices: list });
    });
    updateCount();
}

function renderPortsWorkspace(snapshot, container) {
    const ports = snapshot.allPorts.filter(filterByViewStatePort);
    if (!ports.length) {
        container.innerHTML = emptyMsg('לא נמצאו פורטים לפילטר שנבחר');
        return;
    }
    const rows = document.createElement('div');
    rows.className = 'ports-workspace-list';
    const selected = new Set();

    const toolbar = document.createElement('div');
    toolbar.className = 'ports-toolbar';
    toolbar.innerHTML = `
        <div class="ports-toolbar-title">Port Workspace (${ports.length})</div>
        <div class="ports-toolbar-actions">
            <select id="profile-select">
                <option value="">בחר Profile</option>
                ${Object.values(PORT_PROFILES).map(p => `<option value="${p.key}">${esc(p.label)}</option>`).join('')}
            </select>
            <button class="btn-secondary btn-sm" data-action="select-all">בחר הכל</button>
            <button class="btn-secondary btn-sm" data-action="clear">נקה</button>
            <button class="btn-primary btn-sm" data-action="bulk-edit">עריכה מרוכזת (0)</button>
            <button class="btn-primary btn-sm" data-action="apply-profile">Apply Profile</button>
        </div>
    `;
    container.appendChild(toolbar);
    container.appendChild(rows);

    const updateCount = () => {
        toolbar.querySelector('[data-action="bulk-edit"]').innerHTML = `עריכה מרוכזת (${selected.size})`;
    };

    ports.forEach((port) => {
        const row = document.createElement('div');
        row.className = `port-workspace-row ${port.status === 'פעיל' ? 'active' : 'inactive'}`;
        row.innerHTML = `
            <label><input type="checkbox" data-role="sel"> ${esc(port.portLabel || String(port.portNumber))}</label>
            <span>${esc(port.deviceName || '')}</span>
            <span>${esc(port.siteName || '')}</span>
            <span>VLAN ${esc(port.vlan || '1')}</span>
            <span>${esc(port.mode || 'access')}</span>
            <button type="button" class="btn-secondary btn-sm" data-role="edit">ערוך</button>
        `;
        row.querySelector('[data-role="sel"]')?.addEventListener('change', (e) => {
            if (e.target.checked) selected.add(port.id);
            else selected.delete(port.id);
            updateCount();
        });
        row.querySelector('[data-role="edit"]')?.addEventListener('click', () => openForm('editPort', { port, device: { ip: '' } }));
        rows.appendChild(row);
    });

    toolbar.querySelector('[data-action="select-all"]')?.addEventListener('click', () => {
        selected.clear();
        ports.forEach((p) => selected.add(p.id));
        rows.querySelectorAll('input[type="checkbox"]').forEach((chk) => { chk.checked = true; });
        updateCount();
    });
    toolbar.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
        selected.clear();
        rows.querySelectorAll('input[type="checkbox"]').forEach((chk) => { chk.checked = false; });
        updateCount();
    });
    toolbar.querySelector('[data-action="bulk-edit"]')?.addEventListener('click', () => {
        const selectedPorts = ports.filter(p => selected.has(p.id));
        if (!selectedPorts.length) {
            showToast('בחר פורטים לפני עריכה מרוכזת', 'warning');
            return;
        }
        openForm('bulkEditPorts', { ports: selectedPorts, device: {} });
    });
    toolbar.querySelector('[data-action="apply-profile"]')?.addEventListener('click', async () => {
        const profileKey = toolbar.querySelector('#profile-select')?.value;
        if (!profileKey) {
            showToast('בחר פרופיל קודם', 'warning');
            return;
        }
        const selectedPorts = ports.filter(p => selected.has(p.id));
        if (!selectedPorts.length) {
            showToast('בחר פורטים להחלת Profile', 'warning');
            return;
        }
        const profile = getPortProfile(profileKey);
        const payload = {
            mode: profile.mode,
            vlan: profile.vlan,
            speed: profile.speed,
            status: profile.status,
            portCategory: profile.portCategory
        };
        const validation = validatePortPayload(payload, selectedPorts[0]);
        if (!validation.ok) {
            showToast(validation.message, 'warning');
            return;
        }
        await api.updatePortsBulk(selectedPorts.map(p => p.id), payload);
        showToast(`Profile ${profile.label} הוחל על ${selectedPorts.length} פורטים`);
    });
    updateCount();
}

function applySearchToTree(term, root = document) {
    const allNodes = root.querySelectorAll('.tree-node');
    allNodes.forEach(n => n.style.display = 'none');
    allNodes.forEach(node => {
        const searchable = node.dataset.searchable || '';
        if (searchable.includes(term)) {
            node.style.display = '';
            let parent = node.parentElement;
            while (parent && parent !== document.body) {
                if (parent.classList.contains('tree-node')) parent.style.display = '';
                if (parent.classList.contains('children-container') && parent.classList.contains('hidden')) {
                    parent.classList.remove('hidden');
                    const wrapper = parent.closest('.tree-node');
                    const chevron = wrapper?.querySelector(':scope > .node-header .node-chevron');
                    if (chevron) chevron.classList.add('expanded');
                }
                parent = parent.parentElement;
            }
        }
    });
}

// ---- Site Node ----
function createSiteNode(site, snapshot = null, expandedSet = new Set()) {
    const el = document.createElement('div');
    el.className = 'tree-node';
    el.dataset.type = 'site';
    el.dataset.id = site.id;
    el.dataset.parentId = 'root';
    el.dataset.searchable = `${site.name} ${site.address || ''} ${site.contactPerson || ''} ${site.description || ''}`.toLowerCase();

    const header = buildHeader(
        'fa-building', 'rgba(59,130,246,0.12)', '#3b82f6',
        site.name,
        [site.address, site.contactPerson].filter(Boolean).join(' | '),
        '', false,
        [{ cls: 'add', icon: 'fa-plus', title: 'הוסף ארון' },
         { cls: 'edit', icon: 'fa-pen', title: 'ערוך' },
         { cls: 'delete', icon: 'fa-trash', title: 'מחק' }]
    );

    const children = document.createElement('div');
    const key = nodeKey('site', site.id);
    const shouldExpand = expandedSet.has(key);
    children.className = `children-container ${shouldExpand ? '' : 'hidden'}`;
    let loaded = false;

    header.addEventListener('click', async (e) => {
        if (e.target.closest('.node-actions')) return;
        toggleChildren(header, children);
        const opened = !children.classList.contains('hidden');
        setExpandedState(expandedSet, key, opened);
        if (!loaded && opened) {
            loaded = true;
            await fillSiteChildren(children, site.id, snapshot, expandedSet);
        }
    });

    bindAction(header, 'add', () => openForm('addCabinet', { siteId: site.id }));
    bindAction(header, 'edit', () => openForm('editSite', site));
    bindAction(header, 'delete', () => showConfirm(
        `למחוק את האתר "${site.name}" וכל הציוד שבו?`,
        async () => { await api.deleteSite(site.id); showToast('האתר נמחק'); }
    ));

    el.appendChild(header);
    const inner = document.createElement('div');
    inner.className = 'tree-node-inner';
    inner.appendChild(children);
    el.appendChild(inner);
    if (shouldExpand) {
        const chev = header.querySelector('.node-chevron');
        if (chev) chev.classList.add('expanded');
        loaded = true;
        fillSiteChildren(children, site.id, snapshot, expandedSet);
    }
    return el;
}

// ---- Cabinet Node ----
function createCabinetNode(cab, siteId, snapshot = null, expandedSet = new Set()) {
    const el = document.createElement('div');
    el.className = 'tree-node';
    el.dataset.type = 'cabinet';
    el.dataset.id = cab.id;
    el.dataset.parentId = siteId;
    el.dataset.searchable = `${cab.name} ${cab.location || ''} ${cab.cabinetNumber || ''}`.toLowerCase();

    const subtitle = [cab.location, cab.rackSize ? cab.rackSize + 'U' : '', cab.cabinetNumber ? '#' + cab.cabinetNumber : ''].filter(Boolean).join(' | ');
    const header = buildHeader(
        'fa-server', 'rgba(245,158,11,0.12)', '#f59e0b',
        cab.name, subtitle, '', false,
        [{ cls: 'add', icon: 'fa-plus', title: 'הוסף ציוד' },
         { cls: 'edit', icon: 'fa-pen', title: 'ערוך' },
         { cls: 'delete', icon: 'fa-trash', title: 'מחק' }]
    );

    const children = document.createElement('div');
    const key = nodeKey('cabinet', cab.id);
    const shouldExpand = expandedSet.has(key);
    children.className = `children-container ${shouldExpand ? '' : 'hidden'}`;
    let loaded = false;

    header.addEventListener('click', async (e) => {
        if (e.target.closest('.node-actions')) return;
        toggleChildren(header, children);
        const opened = !children.classList.contains('hidden');
        setExpandedState(expandedSet, key, opened);
        if (!loaded && opened) {
            loaded = true;
            await fillCabinetChildren(children, cab.id, snapshot, expandedSet);
        }
    });

    bindAction(header, 'add', () => openForm('addDevice', { cabinetId: cab.id }));
    bindAction(header, 'edit', () => openForm('editCabinet', { ...cab, siteId }));
    bindAction(header, 'delete', () => showConfirm(
        `למחוק את הארון "${cab.name}" וכל הציוד שבו?`,
        async () => { await api.deleteCabinet(cab.id); showToast('הארון נמחק'); }
    ));

    el.appendChild(header);
    const inner = document.createElement('div');
    inner.className = 'tree-node-inner';
    inner.appendChild(children);
    el.appendChild(inner);
    if (shouldExpand) {
        const chev = header.querySelector('.node-chevron');
        if (chev) chev.classList.add('expanded');
        loaded = true;
        fillCabinetChildren(children, cab.id, snapshot, expandedSet);
    }
    return el;
}

// ---- Device Node ----
function createDeviceNode(dev, cabinetId, snapshot = null, expandedSet = new Set()) {
    const catKey = getCategoryForDevice(dev);
    const cat = getCategoryConfig(catKey);
    const totalPorts = (parseInt(dev.portCount) || 0) + (parseInt(dev.uplinkCount) || 0);
    const hasPorts = totalPorts > 0 || (!dev.category && dev.portCount);

    const el = document.createElement('div');
    el.className = 'tree-node';
    el.dataset.type = 'device';
    el.dataset.id = dev.id;
    el.dataset.parentId = cabinetId;
    el.dataset.searchable = `${dev.name} ${dev.ip || ''} ${dev.model || ''} ${cat.labelHe} ${cat.label} ${dev.serialNumber || ''}`.toLowerCase();

    const ipPart = dev.ip ? ` [${dev.ip}]` : '';
    const badgeHtml = getCategoryBadge(catKey);
    const poeHtml = dev.poe ? '<span class="poe-badge">PoE</span>' : '';
    const subtitleParts = [dev.model, dev.serialNumber ? 'S/N: ' + dev.serialNumber : '', dev.firmware ? 'FW: ' + dev.firmware : ''].filter(Boolean).join(' | ');

    const header = buildHeader(
        cat.icon, cat.color + '18', cat.color,
        esc(dev.name) + esc(ipPart), subtitleParts,
        badgeHtml + poeHtml, !hasPorts,
        [{ cls: 'edit', icon: 'fa-pen', title: 'ערוך' },
         { cls: 'delete', icon: 'fa-trash', title: 'מחק' }]
    );

    const portsContainer = document.createElement('div');
    const key = nodeKey('device', dev.id);
    const shouldExpand = expandedSet.has(key);
    portsContainer.className = `children-container ${shouldExpand ? '' : 'hidden'}`;
    let loaded = false;

    if (hasPorts) {
        header.addEventListener('click', async (e) => {
            if (e.target.closest('.node-actions')) return;
            toggleChildren(header, portsContainer);
            const opened = !portsContainer.classList.contains('hidden');
            setExpandedState(expandedSet, key, opened);
            if (!loaded && opened) {
                loaded = true;
                await fillDevicePorts(portsContainer, dev, snapshot);
            }
        });
    }

    bindAction(header, 'edit', () => openForm('editDevice', { ...dev, cabinetId }));
    bindAction(header, 'delete', () => showConfirm(
        `למחוק את "${dev.name}" וכל הפורטים שלו?`,
        async () => { await api.deleteDevice(dev.id); showToast('הציוד נמחק'); }
    ));

    el.appendChild(header);
    const inner = document.createElement('div');
    inner.className = 'tree-node-inner';
    inner.appendChild(portsContainer);
    el.appendChild(inner);
    if (hasPorts && shouldExpand) {
        const chev = header.querySelector('.node-chevron');
        if (chev) chev.classList.add('expanded');
        loaded = true;
        fillDevicePorts(portsContainer, dev, snapshot);
    }
    return el;
}

// ---- Ports ----
function renderPorts(ports, container, device) {
    container.innerHTML = '';
    if (ports.length === 0) {
        container.innerHTML = emptyMsg('אין פורטים להצגה');
        return;
    }
    const section = document.createElement('div');
    section.className = 'ports-section';
    const selectedPorts = new Set();

    const access = ports.filter(p => (p.portCategory || 'access') === 'access');
    const uplinks = ports.filter(p => p.portCategory === 'uplink');

    const toolbar = document.createElement('div');
    toolbar.className = 'ports-toolbar';
    toolbar.innerHTML = `
        <div class="ports-toolbar-title">בחירה מרובה</div>
        <div class="ports-toolbar-actions">
            <button type="button" class="btn-secondary btn-sm" data-action="select-all">בחר הכל</button>
            <button type="button" class="btn-secondary btn-sm" data-action="clear">נקה בחירה</button>
            <button type="button" class="btn-primary btn-sm" data-action="bulk-edit" disabled>עריכה מרוכזת (0)</button>
        </div>
    `;
    section.appendChild(toolbar);

    const allTiles = [];
    const updateSelectionUi = () => {
        const count = selectedPorts.size;
        const bulkBtn = toolbar.querySelector('[data-action="bulk-edit"]');
        bulkBtn.disabled = count === 0;
        bulkBtn.innerHTML = `<i class="fas fa-pen"></i> עריכה מרוכזת (${count})`;
        allTiles.forEach(tile => {
            const id = tile.dataset.portId;
            tile.classList.toggle('selected', selectedPorts.has(id));
        });
    };

    if (access.length > 0) section.appendChild(buildPortGrid('פורטים', access, device, selectedPorts, allTiles, updateSelectionUi));
    if (uplinks.length > 0) section.appendChild(buildPortGrid('Uplinks', uplinks, device, selectedPorts, allTiles, updateSelectionUi));
    if (access.length === 0 && uplinks.length === 0) section.appendChild(buildPortGrid('פורטים', ports, device, selectedPorts, allTiles, updateSelectionUi));

    toolbar.querySelector('[data-action="select-all"]')?.addEventListener('click', () => {
        ports.forEach(p => selectedPorts.add(p.id));
        updateSelectionUi();
    });
    toolbar.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
        selectedPorts.clear();
        updateSelectionUi();
    });
    toolbar.querySelector('[data-action="bulk-edit"]')?.addEventListener('click', () => {
        if (selectedPorts.size === 0) return;
        const selected = ports.filter(p => selectedPorts.has(p.id));
        openForm('bulkEditPorts', { ports: selected, device });
    });

    updateSelectionUi();
    container.appendChild(section);
}

function buildPortGrid(title, ports, device, selectedPorts, allTiles, updateSelectionUi) {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '0.75rem';
    wrap.innerHTML = `<div class="ports-header"><h4>${title} (${ports.length})</h4>
        <div class="port-legend">
            <span class="port-legend-item"><span class="port-legend-dot" style="background:var(--success)"></span> פעיל</span>
            <span class="port-legend-item"><span class="port-legend-dot" style="background:var(--danger)"></span> כבוי</span>
        </div></div>`;
    const grid = document.createElement('div');
    grid.className = 'ports-grid';
    ports.forEach(port => {
        const active = port.status === 'פעיל';
        const label = port.portLabel || `Gi1/0/${port.portNumber}`;
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = `port-tile ${active ? 'port-active' : 'port-inactive'}`;
        tile.dataset.portId = port.id;
        tile.innerHTML = `<span class="port-tile-number">${esc(String(port.portNumber))}</span>`;

        const tooltipHtml = `
            <div><strong>${esc(label)}</strong></div>
            <div>סטטוס: ${esc(port.status || 'לא פעיל')}</div>
            <div>VLAN: ${esc(port.vlan || '1')}</div>
            <div>Mode: ${esc(port.mode || 'access')}</div>
            <div>IP: ${esc(device.ip || '-')}</div>
            <div>מחובר: ${esc(port.connectedTo || '-')}</div>
            <div>תיאור: ${esc(port.description || '-')}</div>
        `;

        tile.addEventListener('mouseenter', (e) => showPortTooltip(tooltipHtml, e));
        tile.addEventListener('mousemove', (e) => movePortTooltip(e));
        tile.addEventListener('mouseleave', hidePortTooltip);

        tile.addEventListener('click', () => {
            if (selectedPorts.has(port.id)) selectedPorts.delete(port.id);
            else selectedPorts.add(port.id);
            updateSelectionUi();
        });

        tile.addEventListener('dblclick', (e) => {
            e.preventDefault();
            openForm('editPort', { port, device });
        });

        tile.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (selectedPorts.has(port.id)) selectedPorts.delete(port.id);
            else selectedPorts.add(port.id);
            updateSelectionUi();
        });

        allTiles.push(tile);
        grid.appendChild(tile);
    });
    wrap.appendChild(grid);
    return wrap;
}

// =============================================
// Forms
// =============================================
export function openForm(type, data = {}) {
    formFields.innerHTML = '';
    modal.classList.remove('hidden');
    currentSubmitAction = null;

    switch (type) {
        case 'addSite': buildSiteForm(); break;
        case 'editSite': buildSiteForm(data); break;
        case 'addCabinet': buildCabinetForm(data.siteId); break;
        case 'editCabinet': buildCabinetForm(data.siteId, data); break;
        case 'addDevice': buildDeviceForm(data.cabinetId); break;
        case 'editDevice': buildDeviceForm(data.cabinetId, data); break;
        case 'bulkEditDevices': buildBulkDeviceForm(data.devices || []); break;
        case 'editPort': buildPortForm(data.port, data.device); break;
        case 'bulkEditPorts': buildBulkPortForm(data.ports || [], data.device); break;
        case 'auditTrail': buildAuditTrailForm(); break;
    }
}

function buildSiteForm(existing = null) {
    modalTitle.textContent = existing ? 'עריכת אתר' : 'הוסף אתר חדש';
    formFields.innerHTML = `
        <div class="form-group"><label>שם האתר / מוקד</label><input type="text" id="f-name" required value="${esc(existing?.name || '')}"></div>
        <div class="form-group"><label>כתובת</label><input type="text" id="f-address" value="${esc(existing?.address || '')}" placeholder="רחוב, עיר"></div>
        <div class="form-row">
            <div class="form-group"><label>איש קשר</label><input type="text" id="f-contact" value="${esc(existing?.contactPerson || '')}"></div>
            <div class="form-group"><label>טלפון</label><input type="text" id="f-phone" value="${esc(existing?.contactPhone || '')}"></div>
        </div>
        <div class="form-group"><label>הערות</label><textarea id="f-notes" rows="2">${esc(existing?.notes || '')}</textarea></div>`;

    currentSubmitAction = async () => {
        const d = { name: val('f-name'), address: val('f-address'), contactPerson: val('f-contact'), contactPhone: val('f-phone'), notes: val('f-notes') };
        if (existing) { await api.updateSite(existing.id, d); showToast('אתר עודכן'); }
        else { await api.addSite(d); showToast('אתר נוסף'); }
    };
}

function buildCabinetForm(siteId, existing = null) {
    modalTitle.textContent = existing ? 'עריכת ארון תקשורת' : 'הוסף ארון תקשורת';
    formFields.innerHTML = `
        <div class="form-group"><label>שם הארון</label><input type="text" id="f-name" required value="${esc(existing?.name || '')}"></div>
        <div class="form-group"><label>מיקום</label><input type="text" id="f-location" value="${esc(existing?.location || '')}" placeholder="קומה, חדר, מבנה"></div>
        <div class="form-row">
            <div class="form-group"><label>גודל ארון (U)</label><input type="number" id="f-racksize" min="1" max="48" value="${existing?.rackSize || '42'}"></div>
            <div class="form-group"><label>מספר ארון</label><input type="text" id="f-number" value="${esc(existing?.cabinetNumber || '')}"></div>
        </div>
        <div class="form-group"><label>הערות</label><textarea id="f-notes" rows="2">${esc(existing?.notes || '')}</textarea></div>`;

    currentSubmitAction = async () => {
        const d = { siteId, name: val('f-name'), location: val('f-location'), rackSize: val('f-racksize'), cabinetNumber: val('f-number'), notes: val('f-notes') };
        if (existing) { await api.updateCabinet(existing.id, d); showToast('ארון עודכן'); }
        else { await api.addCabinet(d); showToast('ארון נוסף'); }
    };
}

function buildDeviceForm(cabinetId, existing = null) {
    modalTitle.textContent = existing ? 'עריכת ציוד' : 'הוסף ציוד רשת';

    const selectedCat = existing ? getCategoryForDevice(existing) : 'switch';
    const catsHtml = Object.entries(DEVICE_CATEGORIES).map(([k, c]) =>
        `<option value="${k}" ${k === selectedCat ? 'selected' : ''}>${c.labelHe} (${c.label})</option>`
    ).join('');

    formFields.innerHTML = `
        <div class="form-section-title"><i class="fas fa-info-circle"></i> פרטי ציוד</div>
        <div class="form-row">
            <div class="form-group"><label>Hostname</label><input type="text" id="f-name" required value="${esc(existing?.name || '')}"></div>
            <div class="form-group"><label>IP Address</label><input type="text" id="f-ip" value="${esc(existing?.ip || '')}" placeholder="192.168.1.1"></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>קטגוריה</label><select id="f-category">${catsHtml}</select></div>
            <div class="form-group"><label>דגם</label><select id="f-model"></select></div>
        </div>
        <div class="form-group hidden" id="f-custom-group"><label>שם דגם מותאם</label><input type="text" id="f-custom" value="${esc(existing?.customModel || '')}"></div>
        <hr class="form-divider">
        <div class="form-section-title"><i class="fas fa-ethernet"></i> פורטים</div>
        <div class="form-row">
            <div class="form-group"><label>פורטים</label><input type="number" id="f-ports" min="0" max="200" value="${existing?.portCount ?? 24}" ${existing ? 'readonly title="לא ניתן לשנות לאחר יצירה"' : ''}></div>
            <div class="form-group"><label>Uplinks</label><input type="number" id="f-uplinks" min="0" max="24" value="${existing?.uplinkCount ?? 0}" ${existing ? 'readonly title="לא ניתן לשנות לאחר יצירה"' : ''}></div>
        </div>
        <hr class="form-divider">
        <div class="form-section-title"><i class="fas fa-barcode"></i> מידע נוסף</div>
        <div class="form-row">
            <div class="form-group"><label>מספר סריאלי</label><input type="text" id="f-serial" value="${esc(existing?.serialNumber || '')}"></div>
            <div class="form-group"><label>Firmware</label><input type="text" id="f-firmware" value="${esc(existing?.firmware || '')}"></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>מיקום בארון (U)</label><input type="number" id="f-rackpos" min="1" max="48" value="${existing?.rackPosition || ''}"></div>
            <div class="checkbox-group"><label><input type="checkbox" id="f-poe" ${existing?.poe ? 'checked' : ''}> PoE</label></div>
        </div>
        <div class="form-group"><label>הערות</label><textarea id="f-notes" rows="2">${esc(existing?.notes || '')}</textarea></div>`;

    const catSel = document.getElementById('f-category');
    const modSel = document.getElementById('f-model');
    const customGrp = document.getElementById('f-custom-group');

    function refreshModels() {
        const cat = DEVICE_CATEGORIES[catSel.value];
        if (!cat) return;
        modSel.innerHTML = cat.models.map(m =>
            `<option value="${m.name}" ${existing?.model === m.name ? 'selected' : ''}>${m.name}</option>`
        ).join('');
        refreshFromModel();
    }

    function refreshFromModel() {
        const cat = DEVICE_CATEGORIES[catSel.value];
        const model = cat?.models.find(m => m.name === modSel.value);
        if (!model) return;
        if (!existing) {
            document.getElementById('f-ports').value = model.ports;
            document.getElementById('f-uplinks').value = model.uplinks;
            document.getElementById('f-poe').checked = !!model.poe;
        }
        customGrp.classList.toggle('hidden', model.name !== 'אחר');
    }

    catSel.addEventListener('change', refreshModels);
    modSel.addEventListener('change', refreshFromModel);
    refreshModels();

    currentSubmitAction = async () => {
        const catKey = catSel.value;
        const cat = DEVICE_CATEGORIES[catKey];
        const model = cat?.models.find(m => m.name === modSel.value);
        const modelName = modSel.value === 'אחר' ? (val('f-custom') || 'אחר') : modSel.value;

        const d = {
            cabinetId,
            name: val('f-name'), ip: val('f-ip'),
            category: catKey, model: modelName,
            serialNumber: val('f-serial'), firmware: val('f-firmware'),
            rackPosition: val('f-rackpos'),
            portCount: parseInt(val('f-ports')) || 0,
            uplinkCount: parseInt(val('f-uplinks')) || 0,
            portNaming: model?.portNaming || '',
            portStart: model?.portStart ?? 1,
            uplinkNaming: model?.uplinkNaming || '',
            uplinkStart: model?.uplinkStart ?? 1,
            poe: document.getElementById('f-poe').checked,
            notes: val('f-notes')
        };

        const deviceValidation = validateDevicePayload(d);
        if (!deviceValidation.ok) {
            showToast(deviceValidation.message, 'warning');
            throw new Error(deviceValidation.message);
        }

        if (existing) {
            const { portNaming, portStart, uplinkNaming, uplinkStart, portCount, uplinkCount, ...upd } = d;
            await api.updateDevice(existing.id, upd);
            showToast('ציוד עודכן');
        } else {
            await api.addDevice(d);
            showToast('ציוד נוסף');
        }
    };
}

function buildPortForm(port, device) {
    const label = port.portLabel || `Gi1/0/${port.portNumber}`;
    modalTitle.textContent = `עריכת פורט ${label}`;
    const mode = port.mode || 'access';
    const speed = port.speed || 'auto';

    formFields.innerHTML = `
        <div class="form-group"><label>תיאור (Description)</label><input type="text" id="f-desc" value="${esc(port.description || '')}"></div>
        <div class="form-group"><label>מחובר ל-</label><input type="text" id="f-conn" value="${esc(port.connectedTo || '')}" placeholder="ציוד / פורט"></div>
        <div class="form-row">
            <div class="form-group"><label>VLAN</label><input type="text" id="f-vlan" value="${esc(port.vlan || '1')}"></div>
            <div class="form-group"><label>סטטוס</label>
                <select id="f-status">
                    <option value="פעיל" ${port.status === 'פעיל' ? 'selected' : ''}>פעיל (Up)</option>
                    <option value="לא פעיל" ${port.status !== 'פעיל' ? 'selected' : ''}>לא פעיל (Down)</option>
                </select></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>מהירות</label>
                <select id="f-speed">
                    ${['auto','10','100','1000','10000','25000'].map(v => `<option value="${v}" ${speed === v ? 'selected' : ''}>${v === 'auto' ? 'Auto' : v >= 1000 ? (v / 1000) + ' Gbps' : v + ' Mbps'}</option>`).join('')}
                </select></div>
            <div class="form-group"><label>מצב</label>
                <select id="f-mode">
                    <option value="access" ${mode === 'access' ? 'selected' : ''}>Access</option>
                    <option value="trunk" ${mode === 'trunk' ? 'selected' : ''}>Trunk</option>
                </select></div>
        </div>
        <div class="form-group"><label>הערות</label><textarea id="f-notes" rows="2">${esc(port.notes || '')}</textarea></div>`;

    currentSubmitAction = async () => {
        const payload = {
            description: val('f-desc'), connectedTo: val('f-conn'),
            vlan: val('f-vlan'), status: val('f-status'),
            speed: val('f-speed'), mode: val('f-mode'), notes: val('f-notes')
        };
        const portValidation = validatePortPayload(payload, port);
        if (!portValidation.ok) {
            showToast(portValidation.message, 'warning');
            throw new Error(portValidation.message);
        }
        await api.updatePort(port.id, payload);
        showToast('פורט עודכן');
    };
}

function buildBulkPortForm(ports, device) {
    if (!ports.length) {
        showToast('לא נבחרו פורטים לעריכה', 'warning');
        closeModal();
        return;
    }

    modalTitle.textContent = `עריכה מרוכזת (${ports.length} פורטים)`;
    formFields.innerHTML = `
        <div class="form-section-title"><i class="fas fa-layer-group"></i> הגדרות שיחולו על כל הפורטים שנבחרו</div>
        <div class="form-group">
            <label>סטטוס</label>
            <select id="f-bulk-status">
                <option value="__keep__">ללא שינוי</option>
                <option value="פעיל">פעיל (Up)</option>
                <option value="לא פעיל">לא פעיל (Down)</option>
            </select>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>VLAN</label>
                <input type="text" id="f-bulk-vlan" placeholder="השאר ריק = ללא שינוי">
            </div>
            <div class="form-group">
                <label>Mode</label>
                <select id="f-bulk-mode">
                    <option value="__keep__">ללא שינוי</option>
                    <option value="access">Access</option>
                    <option value="trunk">Trunk</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>מהירות</label>
                <select id="f-bulk-speed">
                    <option value="__keep__">ללא שינוי</option>
                    ${['auto','10','100','1000','10000','25000'].map(v => `<option value="${v}">${v === 'auto' ? 'Auto' : v >= 1000 ? (v / 1000) + ' Gbps' : v + ' Mbps'}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>מחובר ל-</label>
                <input type="text" id="f-bulk-conn" placeholder="השאר ריק = ללא שינוי">
            </div>
        </div>
        <div class="form-group">
            <label>תיאור</label>
            <input type="text" id="f-bulk-desc" placeholder="השאר ריק = ללא שינוי">
        </div>
        <div class="form-group">
            <label>הערות</label>
            <textarea id="f-bulk-notes" rows="2" placeholder="השאר ריק = ללא שינוי"></textarea>
        </div>
        <div class="form-group">
            <small style="color:var(--text-muted)">טיפ: אפשר לבחור פורטים בקליק ימני או Ctrl+קליק.</small>
        </div>
    `;

    currentSubmitAction = async () => {
        const payload = {};
        const status = val('f-bulk-status');
        const vlan = val('f-bulk-vlan');
        const mode = val('f-bulk-mode');
        const speed = val('f-bulk-speed');
        const connectedTo = val('f-bulk-conn');
        const description = val('f-bulk-desc');
        const notes = val('f-bulk-notes');

        if (status && status !== '__keep__') payload.status = status;
        if (vlan) payload.vlan = vlan;
        if (mode && mode !== '__keep__') payload.mode = mode;
        if (speed && speed !== '__keep__') payload.speed = speed;
        if (connectedTo) payload.connectedTo = connectedTo;
        if (description) payload.description = description;
        if (notes) payload.notes = notes;

        if (Object.keys(payload).length === 0) {
            showToast('לא הוגדרו שינויים', 'warning');
            return;
        }

        const samplePort = ports[0];
        const portValidation = validatePortPayload(payload, samplePort);
        if (!portValidation.ok) {
            showToast(portValidation.message, 'warning');
            throw new Error(portValidation.message);
        }

        await api.updatePortsBulk(ports.map(p => p.id), payload);
        showToast(`עודכנו ${ports.length} פורטים`);
        if (device?.id) {
            // Keep context after bulk update by auto-expanding the tree in the next render.
            setTimeout(() => {
                const search = document.getElementById('search-input');
                if (search?.value?.trim()) {
                    search.dispatchEvent(new Event('input'));
                }
            }, 0);
        }
    };
}

async function buildAuditTrailForm() {
    modalTitle.textContent = 'Audit Trail - פעילות אחרונה';
    const [logs, snapshot] = await Promise.all([
        api.getAuditLogs(120),
        liveSnapshotCache ? Promise.resolve(liveSnapshotCache) : api.getInventorySnapshot()
    ]);
    const lookup = buildAuditLookup(snapshot);
    const cleanupBar = `
        <div class="ports-toolbar" style="padding:0 0 0.7rem">
            <div class="ports-toolbar-title">ניקוי פעילות</div>
            <div class="ports-toolbar-actions">
                <button type="button" class="btn-secondary btn-sm" data-cleanup-days="30">נקה מעל 30 יום</button>
                <button type="button" class="btn-secondary btn-sm" data-cleanup-days="90">נקה מעל 90 יום</button>
                <button type="button" class="btn-secondary btn-sm" data-cleanup-days="180">נקה מעל 180 יום</button>
                <button type="button" class="btn-danger btn-sm" data-cleanup-all="1">נקה הכל</button>
            </div>
        </div>
    `;
    if (!logs.length) {
        formFields.innerHTML = `${cleanupBar}${emptyMsg('אין פעילויות להצגה')}`;
        bindAuditCleanupActions();
        currentSubmitAction = async () => {};
        return;
    }
    formFields.innerHTML = `
        ${cleanupBar}
        <div class="audit-log-list">
            ${logs.map(log => {
                const view = formatAuditLogView(log, lookup);
                return `
                <div class="audit-log-item">
                    <div class="audit-log-head">
                        <strong>${esc(view.title)}</strong>
                        <span>${esc(formatAuditTime(log.createdAt))}</span>
                    </div>
                    <div class="audit-log-body">${esc(view.subtitle)}</div>
                    ${view.extra ? `<div class="audit-log-extra">${esc(view.extra)}</div>` : ''}
                </div>
            `; }).join('')}
        </div>
    `;
    bindAuditCleanupActions();
    currentSubmitAction = async () => {};
}

function bindAuditCleanupActions() {
    formFields.querySelectorAll('[data-cleanup-days]')?.forEach((btn) => {
        btn.addEventListener('click', () => {
            const days = Number(btn.dataset.cleanupDays);
            if (!days) return;
            showConfirm(`למחוק לוגים ישנים מ-${days} ימים?`, async () => {
                const result = await api.cleanupAuditLogs({ olderThanDays: days });
                showToast(`נמחקו ${result.deleted} רשומות פעילות`, 'success');
                await buildAuditTrailForm();
            });
        });
    });
    formFields.querySelector('[data-cleanup-all]')?.addEventListener('click', () => {
        showConfirm('למחוק את כל היסטוריית הפעילות? פעולה זו אינה הפיכה.', async () => {
            const result = await api.cleanupAuditLogs({ deleteAll: true });
            showToast(`נמחקו ${result.deleted} רשומות פעילות`, 'success');
            await buildAuditTrailForm();
        });
    });
}

function buildBulkDeviceForm(devices) {
    if (!devices.length) {
        showToast('לא נבחרו רכיבים לעריכה', 'warning');
        closeModal();
        return;
    }
    modalTitle.textContent = `Bulk Edit רכיבים (${devices.length})`;
    formFields.innerHTML = `
        <div class="form-group">
            <label>קטגוריה</label>
            <select id="f-bulk-dev-category">
                <option value="">ללא שינוי</option>
                ${Object.entries(DEVICE_CATEGORIES).map(([k, c]) => `<option value="${k}">${esc(c.labelHe)}</option>`).join('')}
            </select>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Firmware</label>
                <input type="text" id="f-bulk-dev-firmware" placeholder="ללא שינוי אם ריק">
            </div>
            <div class="checkbox-group">
                <label><input type="checkbox" id="f-bulk-dev-poe"> להחיל PoE פעיל</label>
            </div>
        </div>
        <div class="form-group">
            <label>הערות</label>
            <textarea id="f-bulk-dev-notes" rows="2" placeholder="ללא שינוי אם ריק"></textarea>
        </div>
    `;

    currentSubmitAction = async () => {
        const payload = {};
        const cat = val('f-bulk-dev-category');
        const firmware = val('f-bulk-dev-firmware');
        const notes = val('f-bulk-dev-notes');
        const poeChecked = document.getElementById('f-bulk-dev-poe')?.checked;
        if (cat) payload.category = cat;
        if (firmware) payload.firmware = firmware;
        if (notes) payload.notes = notes;
        if (poeChecked) payload.poe = true;
        if (!Object.keys(payload).length) {
            showToast('לא הוגדרו שינויים', 'warning');
            throw new Error('No changes');
        }
        await api.updateDevicesBulk(devices.map(d => d.id), payload);
        showToast(`עודכנו ${devices.length} רכיבים`);
    };
}

function buildAuditLookup(snapshot) {
    const siteById = new Map((snapshot?.sites || []).map((s) => [s.id, s]));
    const cabinetById = new Map();
    (snapshot?.cabinetsBySite || new Map()).forEach((cabinets, siteId) => {
        cabinets.forEach((cab) => cabinetById.set(cab.id, { ...cab, siteId }));
    });
    const deviceById = new Map((snapshot?.allDevices || []).map((d) => [d.id, d]));
    const portById = new Map((snapshot?.allPorts || []).map((p) => [p.id, p]));
    return { siteById, cabinetById, deviceById, portById };
}

function formatAuditLogView(log, lookup) {
    const action = log?.action || '-';
    const entityType = log?.entityType || '-';
    const details = log?.details || {};

    if (action === 'bulk-update' && entityType === 'port') {
        const ids = Array.isArray(details.portIds) ? details.portIds : [];
        const changes = details.changes || {};
        const ports = ids.map((id) => lookup.portById.get(id)).filter(Boolean);
        const siteSet = new Set(ports.map((p) => p.siteName).filter(Boolean));
        const deviceSet = new Set(ports.map((p) => p.deviceName).filter(Boolean));
        const status = changes.status ? `STATUS => ${changes.status}` : null;
        const vlan = changes.vlan ? `VLAN => ${changes.vlan}` : null;
        const mode = changes.mode ? `MODE => ${changes.mode}` : null;
        const summary = [status, vlan, mode].filter(Boolean).join(' | ') || formatChangeSet(changes);
        const scope = ports.length
            ? `${ports.length} פורטים | ${deviceSet.size} רכיבים | ${siteSet.size} אתרים`
            : `${ids.length} פורטים`;
        return {
            title: `BULK PORT UPDATE`,
            subtitle: scope,
            extra: summary || null
        };
    }

    if (entityType === 'site') {
        const site = lookup.siteById.get(log.entityId);
        const siteName = site?.name || details?.name || log.entityId;
        return {
            title: `${action.toUpperCase()} SITE`,
            subtitle: `SITE: ${siteName}`,
            extra: formatChangeSet(details)
        };
    }

    if (entityType === 'cabinet') {
        const cab = lookup.cabinetById.get(log.entityId);
        const siteName = lookup.siteById.get(cab?.siteId || details?.siteId)?.name || '-';
        const cabName = cab?.name || details?.name || log.entityId;
        return {
            title: `${action.toUpperCase()} CABINET`,
            subtitle: `SITE: ${siteName} | CABINET: ${cabName}`,
            extra: formatChangeSet(details)
        };
    }

    if (entityType === 'device') {
        const device = lookup.deviceById.get(log.entityId);
        const siteName = device?.siteName || '-';
        const cabName = device?.cabinetName || '-';
        const devName = device?.name || details?.name || log.entityId;
        return {
            title: `${action.toUpperCase()} DEVICE`,
            subtitle: `SITE: ${siteName} | CABINET: ${cabName} | DEVICE: ${devName}`,
            extra: formatChangeSet(details)
        };
    }

    if (entityType === 'port') {
        const port = lookup.portById.get(log.entityId);
        const portName = port?.portLabel || `#${port?.portNumber || log.entityId}`;
        const devName = port?.deviceName || '-';
        const siteName = port?.siteName || '-';
        return {
            title: `${action.toUpperCase()} PORT`,
            subtitle: `SITE: ${siteName} | DEVICE: ${devName} | PORT: ${portName}`,
            extra: formatChangeSet(details)
        };
    }

    if (action === 'cleanup') {
        return {
            title: 'CLEANUP AUDIT LOGS',
            subtitle: `נמחקו ${details?.deleted || 0} רשומות`,
            extra: details?.deleteAll ? 'ניקוי מלא' : (details?.olderThanDays ? `לוגים ישנים מ-${details.olderThanDays} ימים` : null)
        };
    }

    return {
        title: `${action.toUpperCase()} ${String(entityType).toUpperCase()}`,
        subtitle: `${entityType} / ${log?.entityId || '-'}`,
        extra: formatChangeSet(details) || null
    };
}

function formatChangeSet(changes) {
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return '';
    const dict = {
        status: 'STATUS',
        vlan: 'VLAN',
        mode: 'MODE',
        speed: 'SPEED',
        name: 'NAME',
        ip: 'IP',
        category: 'CATEGORY',
        firmware: 'FIRMWARE',
        notes: 'NOTES',
        connectedTo: 'CONNECTED_TO',
        location: 'LOCATION'
    };
    const lines = Object.entries(changes)
        .filter(([, value]) => typeof value !== 'undefined' && value !== null && value !== '')
        .map(([key, value]) => `${dict[key] || key.toUpperCase()} => ${String(value)}`);
    return lines.join(' | ');
}

function formatAuditTime(ts) {
    const date = ts?.toDate?.() || (ts?.seconds ? new Date(ts.seconds * 1000) : null);
    if (!date) return '-';
    try {
        return date.toLocaleString('he-IL', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return date.toISOString();
    }
}

// =============================================
// Confirm Dialog
// =============================================
function showConfirm(message, callback) {
    document.getElementById('confirm-message').textContent = message;
    confirmModal.classList.remove('hidden');
    confirmCallback = callback;
}

document.getElementById('confirm-yes')?.addEventListener('click', async () => {
    if (!confirmCallback) return;
    const btn = document.getElementById('confirm-yes');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> מוחק...';
    try { await confirmCallback(); }
    catch (e) { showToast('שגיאה במחיקה', 'error'); console.error(e); }
    confirmCallback = null;
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-trash"></i> מחק';
    confirmModal.classList.add('hidden');
});

function closeConfirm() { confirmCallback = null; confirmModal.classList.add('hidden'); }
document.getElementById('confirm-no')?.addEventListener('click', closeConfirm);
confirmModal?.querySelector('.modal-close')?.addEventListener('click', closeConfirm);
confirmModal?.querySelector('.modal-overlay')?.addEventListener('click', closeConfirm);

// =============================================
// Modal Management
// =============================================
export function closeModal() { modal.classList.add('hidden'); }

modal?.querySelector('.modal-close')?.addEventListener('click', closeModal);
modal?.querySelector('.modal-cancel')?.addEventListener('click', closeModal);
modal?.querySelector('.modal-overlay')?.addEventListener('click', closeModal);

dynamicForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentSubmitAction) return;
    const btn = dynamicForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> שומר...';
    try {
        await currentSubmitAction();
        closeModal();
    } catch (err) {
        console.error('Submit error:', err);
        showToast('שגיאה בשמירה', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> שמור';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!confirmModal.classList.contains('hidden')) closeConfirm();
        else if (!modal.classList.contains('hidden')) closeModal();
    }
});

// =============================================
// Helpers
// =============================================
function buildHeader(icon, bgColor, fgColor, title, subtitle, extraBadges, hideChevron, actions) {
    const header = document.createElement('div');
    header.className = 'node-header';
    const actionsHtml = actions.map(a =>
        `<button class="btn-action ${a.cls}" title="${a.title}"><i class="fas ${a.icon}"></i></button>`
    ).join('');
    header.innerHTML = `
        <div class="node-chevron" ${hideChevron ? 'style="visibility:hidden"' : ''}><i class="fas fa-chevron-left"></i></div>
        <div class="node-icon-wrapper" style="background:${bgColor};color:${fgColor}"><i class="fas ${icon}"></i></div>
        <div class="node-info">
            <div class="node-title"><span class="node-title-text">${title}</span>${extraBadges || ''}</div>
            ${subtitle ? `<div class="node-subtitle">${esc(subtitle)}</div>` : ''}
        </div>
        <div class="node-actions">${actionsHtml}</div>`;
    return header;
}

function toggleChildren(header, container) {
    container.classList.toggle('hidden');
    const chev = header.querySelector('.node-chevron');
    chev.classList.toggle('expanded', !container.classList.contains('hidden'));
}

function bindAction(header, cls, fn) {
    const btn = header.querySelector(`.btn-action.${cls}`);
    if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
}

function miniLoader() {
    return '<div class="loading-state" style="padding:0.75rem"><i class="fas fa-spinner fa-spin"></i></div>';
}

function emptyMsg(text) {
    return `<div class="empty-state" style="padding:0.75rem"><p>${text}</p></div>`;
}

function showPortTooltip(content, evt) {
    if (!activePortTooltip) {
        activePortTooltip = document.createElement('div');
        activePortTooltip.className = 'port-tooltip';
        document.body.appendChild(activePortTooltip);
    }
    activePortTooltip.innerHTML = content;
    activePortTooltip.classList.add('visible');
    movePortTooltip(evt);
}

function movePortTooltip(evt) {
    if (!activePortTooltip) return;
    const margin = 14;
    let x = evt.clientX + margin;
    let y = evt.clientY + margin;
    const rect = activePortTooltip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 8) x = evt.clientX - rect.width - margin;
    if (y + rect.height > window.innerHeight - 8) y = evt.clientY - rect.height - margin;
    activePortTooltip.style.left = `${Math.max(8, x)}px`;
    activePortTooltip.style.top = `${Math.max(8, y)}px`;
}

function hidePortTooltip() {
    if (!activePortTooltip) return;
    activePortTooltip.classList.remove('visible');
}

function validateDevicePayload(payload) {
    if (!payload.name) return { ok: false, message: 'Hostname הוא שדה חובה' };
    if (payload.ip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(payload.ip)) {
        return { ok: false, message: 'כתובת IP אינה בפורמט תקין' };
    }
    const ports = Number(payload.portCount || 0);
    const uplinks = Number(payload.uplinkCount || 0);
    if (ports < 0 || uplinks < 0) return { ok: false, message: 'מספר פורטים חייב להיות חיובי' };
    return { ok: true };
}

function validatePortPayload(payload, currentPort = {}) {
    const vlanCandidate = String(payload.vlan || currentPort.vlan || '1');
    const modeCandidate = payload.mode || currentPort.mode || 'access';
    const categoryCandidate = payload.portCategory || currentPort.portCategory || 'access';
    const vlanOk = /^(\d{1,4})(,\d{1,4})*$/.test(vlanCandidate);
    if (!vlanOk) return { ok: false, message: 'VLAN חייב להיות מספר או רשימת מספרים מופרדת בפסיקים' };
    const vlanParts = vlanCandidate.split(',').map(v => Number(v));
    if (vlanParts.some(v => v < 1 || v > 4094)) return { ok: false, message: 'VLAN חייב להיות בין 1 ל-4094' };
    if (categoryCandidate === 'uplink' && modeCandidate !== 'trunk') {
        return { ok: false, message: 'פורט Uplink חייב להיות במצב Trunk' };
    }
    if (!['פעיל', 'לא פעיל'].includes(payload.status || currentPort.status || 'לא פעיל')) {
        return { ok: false, message: 'סטטוס פורט לא תקין' };
    }
    return { ok: true };
}

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function val(id) {
    return document.getElementById(id)?.value?.trim() || '';
}
