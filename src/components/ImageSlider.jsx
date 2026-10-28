import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { imageapi } from "../screens/Api";
import { studentApi } from "../services/studentApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ImageSlider() {
  const sliderRef = useRef<FlatList>(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (images.length === 0) return;

    const timer = setInterval(() => {
      const nextIndex =
        currentIndex === images.length - 1 ? 0 : currentIndex + 1;

      sliderRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    }, 3000);

    return () => clearInterval(timer);
  }, [currentIndex, images]);

  const fetchImages = async () => {
    try {
const response = await studentApi.post("all_event_image.php", {});
      if (Array.isArray(response.data)) {
        setImages(response.data);
      }
    } catch (error) {
      console.log("Slider API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  if (images.length === 0) return null;

  return (
    <View style={styles.carouselWrap}>
      <FlatList
        ref={sliderRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.carouselCard}>
            <Image
            source={{ uri: `${imageapi}event/eventgallery/${item.eg_photo}` }}
            style={styles.carouselImage}
            resizeMode="cover"
          />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  carouselWrap: {
    marginTop: 10,
  },
  carouselCard: {
    width: SCREEN_WIDTH - 40,
    height: 160,
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#eee",
    elevation: 3,
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
});