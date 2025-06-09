const options = {
    bottom: '44px',
    right: '32px',
    time: '0.69s',
    mixColor: '#eee',
    backgroundColor: '#fff',
    buttonColorDark: '#000',
    buttonColorLight: '#fff',
    saveInCookies: true,
    label: '🔥',
    autoMatchOsTheme: true
};

function addDarkmodeWidget() {
    new Darkmode(options).showWidget();
}
window.addEventListener('load', addDarkmodeWidget);
