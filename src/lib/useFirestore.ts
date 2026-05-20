import { useState, useEffect } from "react";
import { db, collection, onSnapshot, query } from "./firebase";

export function useFirestoreCollection<T>(
  collectionName: string,
  initialData: T[] = [],
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as unknown as T);
        });
        setData(items);
        setLoading(false);
      },
      (error) => {
        const errInfo = {
          error: error instanceof Error ? error.message : String(error),
          operationType: "list",
          path: collectionName,
          authInfo: { userId: null }
        };
        console.error(`Firestore Error [useFirestoreCollection:${collectionName}]: `, JSON.stringify(errInfo));
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading };
}
