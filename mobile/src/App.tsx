import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, FlatList, Image, Linking } from 'react-native';
import Constants from 'expo-constants';

type Deal = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  currency: string | null;
  link_url: string;
  image_url: string | null;
  is_featured: boolean;
};

const API_BASE = (Constants?.expoConfig?.extra as any)?.apiBaseUrl || 'http://localhost:3000';

export default function App() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/public/deals', API_BASE);
      if (q) url.searchParams.set('q', q);
      if (cat) url.searchParams.set('cat', cat);
      const r = await fetch(url.toString());
      const data = await r.json();
      setDeals(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); },[]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1220' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '800' }}>Lootsy</Text>
        <Text style={{ color: '#94a3b8', marginTop: 4 }}>Dagens Superdeal & Veckans topp 10</Text>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Sök deals…"
            placeholderTextColor="#64748b"
            style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 12, borderRadius: 12, color: 'white' }}
          />
          <Pressable onPress={load} style={{ paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#22d3ee', borderRadius: 12 }}>
            <Text style={{ fontWeight: '700' }}>Sök</Text>
          </Pressable>
        </View>

        <FlatList
          style={{ marginTop: 12 }}
          data={deals}
          keyExtractor={(item)=>item.id}
          renderItem={({item}) => (
            <View style={{ backgroundColor: 'rgba(15,23,42,0.7)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
              <View style={{ height: 180, backgroundColor: 'rgba(0,0,0,0.2)' }}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : null}
              </View>
              <View style={{ padding: 12 }}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>{item.title}</Text>
                {item.description ? <Text style={{ color: '#94a3b8', marginTop: 4 }}>{item.description}</Text> : null}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  {item.category ? <Badge label={item.category} /> : null}
                  {item.price ? <Badge label={`${item.price} ${item.currency || 'kr'}`} /> : null}
                </View>
                <Pressable onPress={() => Linking.openURL(`${API_BASE}/api/redirect?id=${item.id}`)} style={{ marginTop: 10, backgroundColor: 'rgba(255,255,255,0.08)', padding: 10, borderRadius: 12 }}>
                  <Text style={{ color: 'white', textAlign: 'center' }}>Till butiken →</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={!loading ? <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>Inga deals ännu – kör synk i webben.</Text> : null}
        />
      </View>
    </SafeAreaView>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View style={{ backgroundColor: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.2)', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
      <Text style={{ color: '#67e8f9', fontSize: 12 }}>{label}</Text>
    </View>
  );
}
