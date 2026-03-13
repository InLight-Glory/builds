2:03
What I've got currently here, and the
2:04
assets are linked below, what I've got
2:06
here is a free character controller and
2:09
a particle effect and some materials.
2:13
So, let me hit play here and just show
2:14
you this boring game. This is the
2:16
easiest thing to make on the planet. All
2:18
you do is drag your character controller
2:20
that you downloaded from from the asset
2:22
store. You drag it in. You put a
2:23
primitive cube there. And then there's
2:25
also this sphere here. And this sphere
2:28
when I touch it, it deletes. That's just
2:29
a very simple script. I'll open it up
2:31
for you. On trigger, enter. It'll play a
2:33
collect sound. And that and it destroys
2:35
it. That's it. These six things here,
2:37
these six things are going to make your
2:40
game 10 times as fun. And so we're going
2:42
to go through each one.
Measurement and Level Sizing
2:44
Let's start with measurement. Most game
2:46
developers when they're building a
2:48
level, they're not thinking about the
2:49
grid. They're not thinking about what's
2:51
the player jump height. They're not
2:54
thinking about what the player's height
2:55
is. They have no idea. They're just
2:57
doing this. And I can make a pretty cool
2:59
looking level like this. Look, it
3:00
doesn't matter whether it's 2D, whether
3:02
you're making an RPG, whether you're
3:04
making a firstperson shooter, it does
3:06
not matter. But if I just have fun, and
3:08
this is this is a particular issue with
3:10
the terrain tool. The terrain tool is
3:13
particular culprit of this. Let me throw
3:14
on a ground color really quick here.
3:16
It's a particular culprit because with
3:18
terrain, it's really hard to be precise.
3:20
So, if I wanted to make a fun little
3:22
game like this where there's a bunch of
3:23
platforms, if I hit play here, it's not
3:26
going to be nearly as fun. And this this
3:28
seems obvious to you guys, but I can't
3:30
tell you how many times me personally,
3:31
but also a ton of other game devs have
3:34
not been precise with their
3:35
measurements. This is not fun. This does
3:37
not feel good because it's the world is
3:40
not fine-tuned to my liking. You want
3:43
the world to be measured precisely for
3:46
your character. Now, the way you do this
3:48
and the way that I do this is I always
3:50
start with fine-tuning the player. So,
3:54
I'm going to start with the player and
3:55
then I'm going to make the world match
3:56
the player. So, I'm going to say, okay,
3:58
well, what is the jump height? How high
4:00
is a comfortable jump? Ideally, it's an
4:02
integer. What is the integer for the
4:04
scale in unity meters of a jump height?
4:07
My guess is, in fact, I'm going to I'm
4:10
going to tell you the truth here. I
4:11
don't have a guess. I figured this out
4:12
before I started the stream, so I know
4:13
exactly what it is. It's going to be the
4:15
exact height of the player. A capsule
4:16
collider for a character controller,
4:18
whether it's a first-person controller
4:19
or a third person character controller,
4:21
2D or 3D, the capsule collider should be
4:24
two times as tall as a uni a unity
4:27
primitive cube. And that this is what
4:28
this is here. It's set to 1 one. It's
4:31
exactly half the height of my capsule
4:33
collider. So, in this game, I like how
4:35
this jump height feels and it's two.
4:38
Okay, so this is my cube here. And it's
4:41
going to now be so much funner to jump
4:43
onto things when it's perfectly sized.
4:46
That sounds so dumb. And it sounds like,
4:49
wow, Thomas, really? This is your
4:51
advice? I can't tell you how many games
4:52
I've played. I I play a lot of your
4:54
games on stream. Most of the time, the
4:56
world is not sized for the controller.
4:58
It's kind of weird. I'm like, what is
5:00
happening here? So, in this case, now
5:02
that I know that units of two are a good
5:05
jump height, I can say, well, okay,
5:06
well, let's make this 4x4. And this this
5:09
also helps a lot with level design. And
5:10
by the way, you can hold V here and snap
5:12
it there so it's perfectly aligned with
5:14
that. And then, by the way, now that you
5:17
know your unit size, you know that one
5:19
is half a jump, two is a full jump. Now
5:22
that we know that, if I turn on snapping
5:24
and I have it set to one here, building
5:26
my level is super easy. I can go, okay,
5:29
we're going to go one unit or two units
5:30
away. We're going to go two units
5:32
higher. So now I know that I'm going to
5:33
be able to jump to that. And I could
5:36
just pretty much predict as I build my
5:38
level. I could say, okay, 6x6. I know
5:41
that I'm going to be able to jump up
5:42
here. So not only is this a game field
5:44
thing, but this is also a level design
5:46
thing, which is a totally different
5:47
workshop we need to do. So this feels so
5:49
much better.
5:52
See? So that's the first thing, which is
5:54
sizing. Now that I know the size of my
5:56
player in terms of his width, he's one
5:58
unit wide, and I know how high he can
6:00
jump, which is two units high. Now I can
6:02
build an entire level based on these
6:04
sizes.
6:06
Okay, so guys, let's go ahead and just
6:08
test this level out. Make sure it's
6:10
decently fun. I'm going to zoom out here
6:11
and go ahead and just platform.
6:14
See how fun that feels? It's very much
6:17
built around my character's abilities.
6:20
That's step one for great game feel.
Color Theory and Visual Polish
6:25
Next up, color theory is going to be one
6:29
of these elements to your game that make
6:31
it feel juicy. Well, it helps
6:33
communicate the game to the player, and
6:35
it makes the player better understand
6:36
the game. So, we're going to quickly do
6:38
some color theory stuff. And the bonus
6:39
here is using lighting, fog, and
6:41
post-processing to complement your color
6:43
theory. So, we're going to briefly do
6:45
this. It's not complicated. There's a
6:47
link below, and you can look at a bunch
6:49
of different color palettes that Adobe
6:51
has, and you just copy and paste them
6:52
into your game. But this is the color
6:54
palette that I want to use. Now, I've
6:56
already created materials for this. The
6:58
materials don't have smoothness values,
7:00
so they're not shiny. So, it's going to
7:01
look very velvety, which I like. The
7:03
blocks are going to have this color. The
7:06
ground is going to have this color, more
7:08
of a subtle gray. The player is going to
7:11
have, this is going to blow your mind.
7:12
The player is going to have this color.
7:14
And the coins are going to have this
7:16
color. And they have a subtle emissive
7:17
on them. Okay? Okay, so the emissive
7:19
makes it well not receive shadows and it
7:21
makes it look like it's a glowing orb.
7:23
So it's just an emissive of that orange
7:25
color. So again, this is the grass. This
7:27
is the player. This is the coin. And
7:29
then these two I'm going to use to
7:30
create a skybox. I've already created
7:32
this. All it is is a gradient at the
7:35
horizon with the yellow color almost
7:37
like the sun is rising and then just a
7:39
simple almost tealish blue. So I've
7:41
already created this skybox. It's it's
7:43
really simple. Um, let's make sure we
7:45
assign the skybox texture. There it is.
7:48
So, as you can see, guys, already the
7:51
game looks 10 times better. I have no
7:53
textures. I'm not using any strange
7:55
weird shaders or materials or adding
7:58
normal maps or specular, none of that.
8:00
All this is is just great color theory.
8:02
And in fact, you know, you can do stuff
8:04
like this. Like, for example, if I
8:06
wanted to do isometric like this, with
8:08
isometric games, what you want to do is
8:10
is create height. In a normal game, you
8:13
get depth, right? You can see into the
8:14
sky like this. With isometric games, you
8:17
don't get depth unless you elevate the
8:20
player. So, I can create like a piece of
8:23
ground here and I can have it floating
8:25
in the sky. And then what you do with
8:26
the skybox is you just bring the horizon
8:28
down. There we go. That looks freaking
8:30
incredible. I love this. This is so
8:32
valuable to understand why color theory
8:35
is probably the lowest hanging fruit of
8:38
all the juice and game feel and flare
8:41
you can add to your game. really quick.
8:42
You'll notice that I said use lighting,
8:44
fog, and post-processing to complement
8:47
your color theory. So, here's what I'm
8:48
going to do. You'll notice that that is
8:50
very kind of obtrusive. There's no
8:53
blending here. So, what you can do is go
8:54
to lighting and add fog and make sure
8:56
the fog is identical to the horizon
8:58
color. And now we've got this subtle
9:01
fade. Now, if we wanted to, we could
9:02
crank it up a little bit like that. You
9:04
know, we can also use post-processing to
9:07
create bloom lens flare. It's just
9:10
adding that level of polish and realism
9:12
to an otherwise very straightforward
9:14
game. So, I'm going to go ahead and turn
9:16
on bloom here. Now, we could crank it up
9:17
if we wanted to. So, I like that. That's
9:19
good. You'll notice that my my uh coins
9:21
are are glowing as well. So, that's
9:23
good. If I wanted to, I could really
9:24
crank it up like that. That looks pretty
9:26
good, actually. And then also lighting.
9:28
Okay, so by default, we have this
9:30
directional light. We can rotate it and
9:32
create some cool different shades. So,
9:33
you'll notice that I'm picking the one
9:35
that I like the best for this level
9:38
design. So that looks pretty good to me.
9:40
And then finally, we can use lighting
9:42
inside of our prefabs. So for example,
9:44
if I go inside my coin here, I can
9:46
actually add this point light here. I'm
9:49
going to save it. And you'll see that it
9:51
has that subtle glow. So this is just a
9:53
lowhanging fruit, adding subtle bits of
9:56
post-processing, some glow here and
9:58
there, some point lights, but overall
10:00
the whole point of this section, mainly
10:02
color theory. And by the way, we've got
10:04
a little lens flare there on our
10:05
directional light. It's just called lens
10:07
flare SRP. Now, if we wanted to, we
10:09
could come up with a stone color as
10:10
well. So, once you get your base color
10:12
palette down, you can start going in and
10:13
saying, well, you know what? I need I
10:14
need a little bit of grays. Let's go to
10:16
our green color, the blocks. I'm going
10:18
to call this block stone, just so we can
10:21
create some variation. And I'm just
10:22
going to eyeball kind of what I'm
10:24
thinking here.
10:26
Okay, let's go down a little bit. There
10:27
we go. So, you can see here why color
10:29
theory is so important.
Reactive Sounds: Jump and Collect
10:32
Next up, next up, reactive sound. I
10:36
could have just said sound. animation
10:37
particles. Reactive means, and this is
10:39
particular to game feel and juice.
10:41
Reactive means that when I press a
10:43
button, I get a reaction. It means that
10:46
when I jump in the air, I get a sound.
10:48
When I collect the coin, instant
10:51
reaction. The player needs to know that
10:53
what they're doing with their fingers is
10:55
getting a reaction. So, let's go ahead
10:56
and start adding in some sound here.
10:58
First things first, we need to do some
11:00
jump sounds. I've got a temporary sound
11:02
here called temp sound. It's just my
11:03
mouth going like that. And so I'm going
11:06
to have a jump sound and a land sound.
11:08
So let's hear this out.
11:13
Okay. So let's let's do some sound
11:15
design here, guys. Just because you're
11:16
making a game that looks simplistic
11:18
doesn't mean you can't add juice and
11:20
flare and flavor to your world and make
11:23
it feel real. So let's go ahead and head
11:25
on over to where I get my sounds. I
11:27
don't recommend you use this source
11:30
because it's expensive. to actually
11:32
license your sounds for games is quite
11:34
expensive, but we're gonna use it in
11:36
this case. A resource you could use
11:37
though if you don't want to pay is
11:39
freound.org. All right, so I'm gonna
11:41
type in um grass foot or grass step. We
11:45
need just a sound.
11:49
These are great. Let's download these. I
11:51
also need a thud sound. And this is
11:52
going to be our jump sound.
11:59
There's a good one right there. I like
12:01
it. Okay, we're going to use a free tool
12:03
called Audacity. We're going to do the
12:04
jump sound first.
12:07
That's great. You want a little bit of a
12:09
tail when the player jumps off the
12:11
ground. And what I mean is it's not just
12:12
it's [laughter]
12:14
you almost want to hear dirt crumble.
12:16
Can you hear that? We can do a little
12:18
bit of a whoosh sound.
12:22
We're going to make that a little bit
12:24
lower and slower.
12:27
Okay, let's try that. And the thing
12:28
about sound is it's all just guess and
12:30
check, man. And I'm going to export this
12:32
as an a uh a wave um sounds. I'm going
12:36
to call this jump. Now, guess what I'm
12:38
going to do? Jump. What? Jump one. I
12:40
don't want one sound. I want like four.
12:43
I want to hear
12:46
every time I'm jumping.
12:50
Okay, let's do a little bit of a h
12:52
sound.
12:56
Okay, let's do that. We're going to do
12:58
call this jump one.
13:04
Okay. So, you can see how it's already
13:05
getting repetitive. So, what we want to
13:07
do here is have a bunch of different
13:08
sounds.
13:25
Yeah. So, I think all we need to do it's
13:27
the land sound doesn't bother me too
13:29
much, honestly. I think what we want to
13:30
do is we want to have the land sound
13:32
play at a much lower value.
13:38
So, reactive sound, right? So, let's
13:40
let's go ahead and jump into artlist.io
13:42
and grab some coin sounds. Okay, so coin
13:45
collect and I'm going to type in magic
13:47
as well because typically you'll get
13:48
some like cool magical or anime type
13:50
sounds.
13:53
That's great. I also want coin coins
13:55
like a sound. It's one thing to have a
13:58
magical sound play. It's another thing
13:59
to sound like it was added to your bag.
14:03
There we go.
14:05
There we go.
14:10
We'll do it together.
14:14
That's good. We're going to go to our
14:15
coin here. Go to the prefab itself. And
14:17
we're just going to add that clip. Coin
14:19
collect here.
14:25
Okay.
Footstep Sounds and Animations
14:27
Now, the way we're going to do footstep
14:28
sounds is we're going to have to we're
14:30
going to have to go into the animation
14:31
section here because sometimes the
14:34
animation will then determine the sound.
14:36
We're going to use what I'm going to
14:38
call animator functions. It's going to
14:40
be a script that plays a sound based on
14:42
a animation event. So, let's go ahead
14:44
and create an animation here. And I'm
14:46
just going to create an anim called
14:49
player walk. All we need to do here is
14:52
we're going to make the root, I believe.
14:53
Let's see here. Yeah, as long as we're
14:55
not messing with the actual capsule
14:56
collider itself. This is purely
14:58
graphical. You do not want to move the
15:00
physics object. You want to move the
15:02
graphic. So, all I'm going to do here is
15:05
I'm going to set it to zero and then I'm
15:07
going to go up to 0 2 and then one. Go
15:10
back down to zero. You think that looks
15:12
good? No. What you want to do with this
15:15
kind of movement, and this is true
15:16
across the board, even if you're doing a
15:17
highly complicated animation, you want
15:19
it to follow gravity. So, what we want
15:20
to do is go to our curves here, and I
15:22
just go to my Yvalue, I can do this.
15:25
This is exactly what a bouncy ball does.
15:27
That subtle change is what separates a
15:30
new game developer from a seasoned one,
15:32
understanding how to use the curves. So,
15:34
it feels heavy. This is just going to
15:36
play by default. So, we can walk around
15:38
and feel it. So, that's fun, right? But
15:40
we want it to stop. Although I don't
15:42
love that the camera is following the
15:43
route. That's much better. It feels much
15:47
bouncier now that the camera isn't
15:48
following it. Now we've got this
15:50
animation. Right. Really quick, I just
15:52
want to make sure this animation only
15:54
plays when the player's walking. Player
15:57
idle. So now we have an idle state where
15:59
the route is set to zero. So the idle
16:01
state is going to be our default. Then
16:03
we're going to create a parameter and
16:04
we're just going to it's going to be a
16:05
simple boolean and it's going to be
16:07
walking. If we're walking, we go
16:10
immediately to the walk state. No exit
16:12
time, but there will be a subtle
16:13
transition. And then we're going to go
16:15
back to idle, but we're not going to
16:17
have an exit time. And do a pretty quick
16:19
transition. Walk needs to loop. I'm fine
16:21
with idle looping as well. We'll create
16:23
a cool idle animation. Walking. If it's
16:25
true, go to walk. If it's false, go back
16:27
to idle. That's all we need. So, now
16:29
that we know what this variable is, what
16:31
I'm going to do is go to my code. I'm
16:33
going to add an animator. public
16:35
animator. Animator. And now I'm just
16:37
going to tell Claude, I'm going to say
16:38
ensure the animator sets a bull called
16:42
walking to true if the player is
16:45
walking. So if we go back to my
16:47
character here, I can go to idle state
16:49
and I can go to my route here and I
16:50
believe I should be able to hopefully
16:52
there's a pivot here. Yay. Okay, the
16:53
pivot's at the bottom. Watch this. So
16:55
what I can do here is I can set this to
16:57
one and I can move up to here. And this
16:59
I love doing this. What I do is I scale
17:01
down like this and then I squeeze up
17:04
like this. So it looks like the volume
17:06
is being displaced. Okay, that's it. So
17:09
let's go ahead and add this stuff. If
17:11
animator does not equal null, is walking
17:13
is going to equal is stable ground and
17:15
square magnitude is greater than zero.
17:17
That's about it. And that's not a bad
17:19
line of code, honestly. Let's see if
17:20
that actually does it. I doubt that this
17:22
will work right out of the gate. Yeah,
17:25
let's take a look here and see. If I set
17:28
is walking to true, it should do it.
17:30
Yep, we need to assign the animator. I
17:31
think that's it, guys.
17:34
There we go.
17:38
So, definitely need a jump animation,
17:39
but that feels a lot funner already.
17:46
Already feels great, man. Now, we're
17:48
going to go back to what we were talking
17:50
about with sound. And we're just going
17:51
to get some grass step sounds.
17:57
And we're going to create a new script.
17:59
I'm just going to call this um animator
18:01
functions. And by the way, I've used
18:03
this in Neverong. I've used this in
18:06
Twisted Tower. Animator functions is one
18:08
of my favorite classes because you can
18:10
use animator functions to create a ton
18:12
of game feel. Okay, so for this one, all
18:14
we're going to do is we're going to have
18:16
a function in here. We can just say uh
18:18
public void um play sound, and then
18:22
it'll be an audio clip clip. And then
18:25
it's just going to be the player audio
18:27
source. It's going to play through the
18:28
player audio source.
18:35
So, let me show you kind of how we're
18:37
going to use this. Now, we can add this
18:39
animator functions class here. And I can
18:42
bring in the audio source. And now I can
18:43
specify which clips I want to play. So,
18:45
step grass one, two, and three. I want
18:49
to play it at like 0.5. And then I can
18:51
go to my an uh my animator here. And I
18:54
want the sound to play when do I want it
18:56
to play immediately? Yes. Because the
18:58
moment I press forward on the keyboard,
19:00
ideally we hear as if the foot is
19:02
pushing on the ground, right? That's a
19:04
key aspect to game feel. One here, one
19:06
here, but not one here.
19:09
[snorts] Actually, let's see here. All
19:11
we need is here. All we need is here.
19:13
One here up. And then when it comes
19:15
down, you hear it again. So, let's see
19:17
if this feels good.
19:23
So, there's one sound there. That's
19:25
trash. What is that sound? Oh, I chose
19:28
the wrong sound.
19:33
Goodness, that feels good. That feels
19:36
really good already. So, for now, for
19:39
now, all I want to do is create an idle
19:42
state where he jumps. That's it.
19:44
Meaning, he's just going to be still.
19:46
And then we're going to we're going to
19:47
make sure that that plays with our code.
19:49
And then we're going to make a bounce
19:50
effect. And hopefully, this looks good.
20:12
Good. All right, let's talk about the
20:15
next key to juice.
Reactive Particles: Dust and Effects
20:18
Another lowhanging fruit [music] is
20:20
reactive particles. And so what we're
20:22
going to do is simply play a particle
20:24
effect when the player jumps. So I've
20:26
got a little game object here called
20:28
dust. And all this is is a simple uh
20:31
standard particle that's built into
20:33
Unity. And if I set it to 25 here, this
20:35
is what it looks like currently. Let's
20:37
clean this up a little bit so that its
20:38
shape isn't so big. We want it to be
20:40
right at the base of the player. I'm
20:42
going to increase the radius a little
20:43
bit so that there's sort of a plume
20:44
occurring. And what you want is you want
20:46
to see how it looks as um a burst,
20:49
right? So, this is how it looks as a
20:51
burst.
20:54
Good. I like that. We're going to go to
20:55
color of a lifetime, and we're going to
20:56
make sure that we have a just a subtle
20:58
fade in. We don't want it to be
20:59
immediate. There we go. We could
21:01
probably go a little bit bigger. Maybe
21:02
like one one to two. There we go. So,
21:04
that's what how it's going to look when
21:05
it when you land or when we jump. So,
21:08
particle effects are a huge aspect to
21:10
creating juice in your game. The
21:12
particles already built into the
21:13
codebase. So, you can see here there's a
21:15
particle system that you can assign. And
21:17
I'm just going to go ahead and turn it
21:18
on here. And they should just go ahead
21:20
and play.
21:31
Freaking told you guys it's looking
21:32
good, man. You know what we need? We
21:34
need a particle that we like. I'm going
21:36
to use a nice clean sphere here. It's
21:38
going to be white. It's just a simple
21:39
white particle for our more tuny looking
21:42
game. I like the sprite effect. That's
21:44
kind of cool. They're a little big. So,
21:46
we're going to do a scale of between 0.5
21:49
and one. Let's go ahead and set the
21:51
color to the brown color of these.
21:58
So, what I can do here is make it feel a
22:00
little bit more tuny.
22:05
I'm going to have it shrink.
22:08
[music]
22:25
pretty good. Okay, we got our particles
22:27
working, right? We've got the collection
22:29
sound. All right, let's go ahead and
22:31
distribute some coins and start working
22:32
on the sound and the music. [music]
22:39
All right, we got a fun little
22:40
background here.
22:47
Brilliant. Okay, I would like to, if I
22:50
can, I would like to flash the player
22:53
when I collect something. So, I'm
22:55
curious if we could create a new layer
22:56
here. And I'm going to call this color.
22:58
There's our capsule. Set emission to
23:00
true. I want it to be white, the same
23:02
color as the coin, as if it was absorbed
23:03
into my body. There we go. So that's
23:05
what happens when I collect a coin.
23:07
Okay.
23:10
Oh, it works.
23:16
Let's go ahead and move forward to the
Music and Ambience
23:18
last one. This is such an afterthought
23:21
for most game devs. Music and ambience.
23:24
I've played a lot of your games on my
23:26
streams. Typically, there's no ambience.
23:28
I don't know why, but ambience just
23:29
doesn't exist. And the music it
23:31
sometimes it it feels like the developer
23:34
wrote it themselves. And so I understand
23:36
that it's expensive to get music, but
23:38
oftentimes there's just there's music
23:39
that you can buy online or you can get a
23:41
friend to write your music or something.
23:43
That is tough. You know, music can be
23:44
expensive. But let's just go ahead and
23:46
jump inside of artlist.io. Find some
23:48
good music and find some good sound
23:50
effects.
23:52
That's great.
23:56
That's good, too. All right. All right,
23:57
let's go to our music here and we're
23:59
going to type in adventure medieval. I
24:02
don't know.
24:15
[music]
24:16
By the way, guys, you might be thinking,
24:17
why am I just picking random ones? I'm
24:20
looking for the ones that don't have a
24:21
full waveform. Like this right here. I
24:23
could tell you right away I don't want.
24:27
Right. You can just see it in the
24:28
waveform.
24:35
[music]
24:36
That's great. That feels like Minecraft.
24:38
That's what we want.
24:55
[music]
Final Touches: Front Flip and Outro
24:59
Okay, I want to do a front flip. I'm
25:01
sorry. I want to do a front flip. So,
25:03
we're going to do for the jump. We're
25:04
going to see what happens if I could do
25:05
a front flip. Wouldn't that be great?
25:11
That is so fun. We need a flip sound,
25:14
obviously.
25:22
That is so fun.
25:43
Yeah.
25:55
Also, hey, don't forget to check out
25:57
Bezi. You can learn more about their new
25:59
Bezi actions feature in the video I made
26:01
recently trying it out. And you can also
26:03
get started with Bezi for free using the
26:05
link in the description.

