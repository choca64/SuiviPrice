@echo off

:: Vérifier si Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/
    pause
    exit /b
)

echo Node.js est installé.

:: Vérifier si npm est installé
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo npm n'est pas installé. Veuillez l'installer avec Node.js.
    pause
    exit /b
)

echo npm est installé.

:: Lancer le serveur avec npm start
echo Démarrage du serveur...
start "" "cmd.exe" /k "npm start"

:: Pause pour permettre au serveur de démarrer
timeout /t 2 >nul

:: Ouvrir l'application dans le navigateur
echo Ouverture de l'application dans le navigateur...
start http://localhost:3000

:: Fin du script
echo L'application est prête. Appuyez sur une touche pour fermer ce script.
pause
exit
