-- Alliance logos and the colour only each alliance has, both taken from the logos the
-- owner sent (23 Nov 2026). The accent colour is what a picked alliance glows in.
alter table alliances add column if not exists accent_color text;

update alliances set logo_file = 'dvl.png', accent_color = '#A57BD8' where id = 'dvl';
update alliances set logo_file = 'top.png', accent_color = '#4A78D8' where id = 'top';
