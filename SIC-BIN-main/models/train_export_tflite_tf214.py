"""
Train and export a Raspberry Pi compatible TFLite classifier.

Compatibility target:
- TensorFlow 2.14.x conversion
- tflite-runtime 2.14.0 on Raspberry Pi

Dataset layouts supported:
1) Preferred (explicit validation set)
   dataset_root/
     train/<class_name>/*.jpg
     val/<class_name>/*.jpg

2) Train-only (auto split with --validation-split)
   dataset_root/
     <class_name>/*.jpg
"""

from __future__ import annotations

import argparse
from pathlib import Path

import tensorflow as tf


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train and export TFLite model (TF 2.14)")
    parser.add_argument(
        "--dataset-root",
        type=Path,
        required=True,
        help="Root folder containing either train/val folders or class folders",
    )
    parser.add_argument("--image-size", type=int, default=224, help="Input image size (square)")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--epochs", type=int, default=15, help="Training epochs")
    parser.add_argument(
        "--validation-split",
        type=float,
        default=0.2,
        help="Validation split for train-only layout",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Seed used for train-only split",
    )
    parser.add_argument(
        "--output-model",
        type=Path,
        default=Path("model.tflite"),
        help="Output path for exported .tflite model",
    )
    parser.add_argument(
        "--output-labels",
        type=Path,
        default=Path("labels.txt"),
        help="Output path for labels.txt",
    )
    return parser.parse_args()


def load_datasets(args: argparse.Namespace):
    image_size = (args.image_size, args.image_size)
    train_dir = args.dataset_root / "train"
    val_dir = args.dataset_root / "val"

    if train_dir.exists() and val_dir.exists():
        train_ds = tf.keras.utils.image_dataset_from_directory(
            train_dir,
            image_size=image_size,
            batch_size=args.batch_size,
            label_mode="int",
            shuffle=True,
        )
        val_ds = tf.keras.utils.image_dataset_from_directory(
            val_dir,
            image_size=image_size,
            batch_size=args.batch_size,
            label_mode="int",
            shuffle=False,
        )
    else:
        train_ds = tf.keras.utils.image_dataset_from_directory(
            args.dataset_root,
            validation_split=args.validation_split,
            subset="training",
            seed=args.seed,
            image_size=image_size,
            batch_size=args.batch_size,
            label_mode="int",
            shuffle=True,
        )
        val_ds = tf.keras.utils.image_dataset_from_directory(
            args.dataset_root,
            validation_split=args.validation_split,
            subset="validation",
            seed=args.seed,
            image_size=image_size,
            batch_size=args.batch_size,
            label_mode="int",
            shuffle=False,
        )

    class_names = train_ds.class_names
    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(autotune)
    val_ds = val_ds.prefetch(autotune)

    return train_ds, val_ds, class_names


def build_model(image_size: int, num_classes: int) -> tf.keras.Model:
    base = tf.keras.applications.MobileNetV2(
        input_shape=(image_size, image_size, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False

    inputs = tf.keras.Input(shape=(image_size, image_size, 3))
    x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)
    x = base(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.2)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)
    model = tf.keras.Model(inputs, outputs)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def export_tflite(model: tf.keras.Model, output_model: Path) -> None:
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    output_model.parent.mkdir(parents=True, exist_ok=True)
    output_model.write_bytes(tflite_model)


def write_labels(labels: list[str], output_labels: Path) -> None:
    output_labels.parent.mkdir(parents=True, exist_ok=True)
    with output_labels.open("w", encoding="utf-8") as f:
        for i, name in enumerate(labels):
            f.write(f"{i} {name}\n")


def main() -> None:
    args = parse_args()
    train_ds, val_ds, class_names = load_datasets(args)

    model = build_model(args.image_size, len(class_names))
    model.fit(train_ds, validation_data=val_ds, epochs=args.epochs)

    export_tflite(model, args.output_model)
    write_labels(class_names, args.output_labels)

    print(f"Saved model: {args.output_model.resolve()}")
    print(f"Saved labels: {args.output_labels.resolve()}")
    print("Done. Copy these files to the Raspberry Pi models folder.")


if __name__ == "__main__":
    main()
