{pkgs}: {
  deps = [
    pkgs.libffi
    pkgs.gdk-pixbuf
    pkgs.fribidi
    pkgs.harfbuzz
    pkgs.freetype
    pkgs.fontconfig
    pkgs.gobject-introspection
    pkgs.glib
    pkgs.pango
    pkgs.cairo
  ];
}
