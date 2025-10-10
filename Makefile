CC = gcc
CFLAGS = -Wall -Wextra -O2 \
    -I/usr/include/SDL2 \
    -I/usr/include/glib-2.0 \
    -I/usr/lib/x86_64-linux-gnu/glib-2.0/include \
    -I/usr/include/opus \
    -I/usr/include/x86_64-linux-gnu \
    -I/usr/include/pipewire-0.3 \
    -I/usr/include/spa-0.2 \
    -I/usr/include/dbus-1.0 \
    -I/usr/lib/x86_64-linux-gnu/dbus-1.0/include \
    -I/usr/include/libinstpatch-2 \
    -I/usr/include/harfbuzz \
    -I/usr/include/freetype2 \
    -I/usr/include/libpng16 \
    -pthread -D_REENTRANT -D_DEFAULT_SOURCE -D_XOPEN_SOURCE=600

LDFLAGS = -lSDL2 -lSDL2_mixer -lSDL2_ttf

SRC = tetris_web.cpp
OBJ = $(SRC:.cpp=.o)
TARGET = tetris

all: $(TARGET)

$(TARGET): $(OBJ)
	$(CC) $(OBJ) -o $@ $(LDFLAGS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

run: $(TARGET)
	chmod +x ./$(TARGET)
	./$(TARGET)

clean:
	rm -f $(OBJ) $(TARGET)
cleanobj:
	rm -f $(OBJ)


