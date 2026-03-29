# train_disease.py
# Dataset: PlantVillage – https://www.kaggle.com/datasets/emmarex/plantdisease
# pip install tensorflow pillow kaggle

import os
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator

IMG_SIZE   = 224
BATCH      = 32
EPOCHS     = 20
DATA_DIR   = "PlantVillage"          # extracted dataset root
MODEL_OUT  = "disease_model.h5"

# Download:
#   kaggle datasets download -d emmarex/plantdisease
#   unzip plantdisease.zip -d PlantVillage

train_gen = ImageDataGenerator(
    rescale=1.0/255, rotation_range=20, zoom_range=0.2,
    horizontal_flip=True, validation_split=0.2,
)
train_ds = train_gen.flow_from_directory(
    DATA_DIR, target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH, subset="training",
)
val_ds = train_gen.flow_from_directory(
    DATA_DIR, target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH, subset="validation",
)

NUM_CLASSES = len(train_ds.class_indices)

base = tf.keras.applications.MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False, weights="imagenet",
)
base.trainable = False

model = models.Sequential([
    base,
    layers.GlobalAveragePooling2D(),
    layers.Dense(256, activation="relu"),
    layers.Dropout(0.4),
    layers.Dense(NUM_CLASSES, activation="softmax"),
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-4),
    loss="categorical_crossentropy",
    metrics=["accuracy"],
)

cb = [
    tf.keras.callbacks.EarlyStopping(patience=4, restore_best_weights=True),
    tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=2),
]

model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS, callbacks=cb)

# Fine-tune top layers
base.trainable = True
for layer in base.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-5),
    loss="categorical_crossentropy", metrics=["accuracy"],
)
model.fit(train_ds, validation_data=val_ds, epochs=10, callbacks=cb)

model.save(MODEL_OUT)
print(f"Model saved to {MODEL_OUT}")
print("Class mapping:", train_ds.class_indices)
