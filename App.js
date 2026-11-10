import { useState, useEffect } from "react";
import { FlatList, StyleSheet, View, Alert } from "react-native";
import {
  Appbar,
  Button,
  List,
  PaperProvider,
  Switch,
  Text,
  MD3LightTheme as DefaultTheme,
} from "react-native-paper";
import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as SQLite from "expo-sqlite";

const THEME_KEY = "@darkMode";
let db = null;

async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("locations.db");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL
      );
    `);
  }
  return db;
}

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]); 

  
  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });

  async function loadDarkMode() {
    try {
      const savedDarkMode = await AsyncStorage.getItem(THEME_KEY);
      if (savedDarkMode !== null) {
        setIsSwitchOn(JSON.parse(savedDarkMode));
      }
    } catch (error) {
      console.error("Erro ao carregar o tema:", error);
    }
  }

  async function onToggleSwitch() {
    try {
      const newValue = !isSwitchOn;
      setIsSwitchOn(newValue);
      await AsyncStorage.setItem(THEME_KEY, JSON.stringify(newValue));
    } catch (error) {
      console.error("Erro ao salvar o tema:", error);
    }
  }

  async function getLocation() {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permissão Negada",
          "Permita o acesso à localização para registrar as coordenadas."
        );
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      const database = await getDb();
      await database.runAsync(
        "INSERT INTO locations (latitude, longitude) VALUES (?, ?);",
        [latitude, longitude]
      );

      await loadLocations();
    } catch (error) {
      console.error("Erro ao capturar localização:", error);
      Alert.alert("Erro", "Não foi possível obter a localização.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadLocations() {
    setIsLoading(true);
    try {
      const database = await getDb();
      const allRows = await database.getAllAsync(
        "SELECT * FROM locations ORDER BY id DESC;"
      );
      setLocations(allRows || []);
    } catch (error) {
      console.error("Erro ao buscar localizações:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDarkMode();
    loadLocations();
  }, []);

  useEffect(() => {
    if (isSwitchOn) {
      setTheme({ ...theme, colors: myColorsDark.colors });
    } else {
      setTheme({ ...theme, colors: myColors.colors });
    }
  }, [isSwitchOn]);

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="My Location BASE" />
      </Appbar.Header>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={styles.containerDarkMode}>
          <Text>Dark Mode</Text>
          <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
        </View>
        <Button
          style={styles.containerButton}
          icon="map"
          mode="contained"
          loading={isLoading}
          onPress={() => getLocation()}
        >
          Capturar localização
        </Button>

        <FlatList
          style={styles.containerList}
          data={locations}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              Nenhuma localização registrada ainda.
            </Text>
          }
          renderItem={({ item }) => (
            <List.Item
              title={`Localização ${item.id}`}
              description={`Latitude: ${item.latitude} | Longitude: ${item.longitude}`}
            />
          )}
        />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  containerDarkMode: {
    margin: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerButton: {
    margin: 10,
  },
  containerList: {
    margin: 10,
  },
});