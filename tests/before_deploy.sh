#!/bin/bash

cd build/Marknote/osx32/
zip -r MarknoteMac.zip ./*
cd ../win32/
zip -r MarknoteWin.zip ./*
cd ../linux64/
zip -r MarknoteLinux.zip ./*
cd ../../../
mv build/Marknote/osx32/MarknoteMac.zip ./
mv build/Marknote/win32/MarknoteWin.zip ./
mv build/Marknote/linux64/MarknoteLinux.zip ./