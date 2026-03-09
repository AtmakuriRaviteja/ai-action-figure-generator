import cv2
import sys

image_path = sys.argv[1]

# Load image
img = cv2.imread(image_path)

# Load face detection model
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

faces = face_cascade.detectMultiScale(
    gray,
    scaleFactor=1.3,
    minNeighbors=5
)

if len(faces) == 0:
    print("no_face")
else:
    print("face_detected")