// In-memory/localStorage mock of Firestore

const getPrefix = (path: string) => `brandforge_${path}`;

export const collection = (db: any, path: string) => {
  return { type: 'collection', path };
};

export const doc = (db: any, path: string, id?: string) => {
  if (!id) {
    // doc(db, 'path/to/thing') -> path represents collection/id
    const parts = path.split('/');
    id = parts.pop() || '';
    path = parts.join('/');
  }
  return { type: 'doc', path, id };
};

// Simple read from local storage
const readCollection = (path: string) => {
  const data = localStorage.getItem(getPrefix(path));
  return data ? JSON.parse(data) : {};
};

// Simple write to local storage
const writeCollection = (path: string, data: any) => {
  localStorage.setItem(getPrefix(path), JSON.stringify(data));
  // Emit event so onSnapshot can trigger
  window.dispatchEvent(new CustomEvent(`localdb_update_${path}`));
};

export const setDoc = async (docRef: any, data: any) => {
  const colData = readCollection(docRef.path);
  colData[docRef.id] = data;
  writeCollection(docRef.path, colData);
};

export const updateDoc = async (docRef: any, data: any) => {
  const colData = readCollection(docRef.path);
  if (colData[docRef.id]) {
    colData[docRef.id] = { ...colData[docRef.id], ...data };
    writeCollection(docRef.path, colData);
  }
};

export const deleteDoc = async (docRef: any) => {
  const colData = readCollection(docRef.path);
  if (colData[docRef.id]) {
    delete colData[docRef.id];
    writeCollection(docRef.path, colData);
  }
};

export const getDoc = async (docRef: any) => {
  const colData = readCollection(docRef.path);
  const data = colData[docRef.id];
  return {
    exists: () => !!data,
    data: () => data
  };
};

export const query = (collectionRef: any, ...constraints: any[]) => {
  return {
    ...collectionRef,
    constraints
  };
};

export const where = (field: string, op: string, value: any) => ({ type: 'where', field, op, value });
export const orderBy = (field: string, direction: string = 'asc') => ({ type: 'orderBy', field, direction });

export const onSnapshot = (queryRef: any, onNext: (snap: any) => void, onError?: (err: any) => void) => {
  const processQuery = () => {
    const colData = readCollection(queryRef.path);
    let results = Object.values(colData);

    // Apply constraints
    if (queryRef.constraints) {
      for (const c of queryRef.constraints) {
        if (c.type === 'where' && c.op === '==') {
          results = results.filter((item: any) => item[c.field] === c.value);
        } else if (c.type === 'orderBy') {
          results = results.sort((a: any, b: any) => {
            const valA = a[c.field];
            const valB = b[c.field];
            if (valA < valB) return c.direction === 'asc' ? -1 : 1;
            if (valA > valB) return c.direction === 'asc' ? 1 : -1;
            return 0;
          });
        }
      }
    }

    onNext({
      docs: results.map((data) => ({
        data: () => data,
      }))
    });
  };

  // Initial trigger
  processQuery();

  // Listen for changes
  const listener = () => processQuery();
  window.addEventListener(`localdb_update_${queryRef.path}`, listener);

  return () => {
    window.removeEventListener(`localdb_update_${queryRef.path}`, listener);
  };
};

export const batchImportProjects = (projects: any[]) => {
  const colData: Record<string, any> = {};
  projects.forEach(p => {
    colData[p.id] = p;
  });
  writeCollection('projects', colData);
};
