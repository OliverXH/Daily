let theme = new Howl({
    src: ['audio/MainTheme.wav']
});

let engine_1 = new Howl({
    src: ['audio/SonidoCoche_1.wav'],
    loop: true
});
// console.log(engine_1);

let engine_2 = new Howl({
    src: ['audio/SonidoCoche_2.wav'],
    loop: true
});

let ground = new Howl({
    src: ['audio/Grava.wav'],
    loop: true,
    volume: 0.2
});

let brake = new Howl({
    src: ['audio/Frenada.wav'],
    loop: true,
    volume: 0.2
});