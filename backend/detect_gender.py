import cv2
import sys
import insightface

image_path = sys.argv[1]

app = insightface.app.FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=0)

img = cv2.imread(image_path)
faces = app.get(img)

if len(faces) == 0:
    print("unknown")
else:
    gender = faces[0].gender
    if gender == 1:
        print("male")
    else:
        print("female")