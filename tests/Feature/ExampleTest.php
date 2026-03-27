<?php

it('redirects guests from / to the events index', function () {
    $response = $this->get('/');

    $response->assertRedirect(route('events.index'));
});
