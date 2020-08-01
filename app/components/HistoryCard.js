﻿import React, { Component} from 'react';
import { View, SafeAreaView, FlatList } from 'react-native';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import moment from 'moment';
import momentFormat from 'moment-duration-format';
import { Card, IconButton, Button, Caption, Title, Subheading, List, Text} from 'react-native-paper';
import Icon from  'react-native-vector-icons/MaterialCommunityIcons';
import uuid from 'react-native-uuid';

import styles from '../assets/styles/blink/_HistoryCard.scss';

import UserIcon from './UserIcon';


function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

const Item = ({ nr, uri, displayName }) => (
  <View style={styles.participantView}>
    {displayName !==  uri?
    <Text style={styles.participant}>{nr}. {displayName} ({uri})</Text>
    :
    <Text style={styles.participant}>{nr}. {uri}</Text>
    }

  </View>
);

const renderItem = ({ item }) => (
 <Item nr={item.nr} uri={item.uri} displayName={item.displayName}/>
);



class HistoryCard extends Component {
    constructor(props) {
        super(props);
        autoBind(this);

        this.state = {
            id: this.props.contact.id,
            displayName: this.props.contact.displayName,
            uri: this.props.contact.remoteParty,
            participants: this.props.contact.participants,
            conference: this.props.contact.conference,
            type: this.props.contact.type,
            photo: this.props.contact.photo,
            label: this.props.contact.label,
            orientation: this.props.orientation,
            isTablet: this.props.isTablet,
            favorite: (this.props.contact.tags.indexOf('favorite') > -1)? true : false,
            blocked: (this.props.contact.tags.indexOf('blocked') > -1)? true : false,
            confirmed: false
        }
    }

    shouldComponentUpdate(nextProps) {
        //https://medium.com/sanjagh/how-to-optimize-your-react-native-flatlist-946490c8c49b
        return true;
    }

    handleParticipant() {
    }

    findObjectByKey(array, key, value) {
        for (var i = 0; i < array.length; i++) {
            if (array[i][key] === value) {
                return array[i];
            }
        }
        return null;
    }

    setBlockedUri() {
        let newBlockedState = this.props.setBlockedUri(this.state.uri);
        this.setState({blocked: newBlockedState});
    }

    deleteHistoryEntry() {
        this.props.deleteHistoryEntry(this.state.uri);
    }

    undo() {
        this.setState({confirmed: false, action: null});
    }

    setFavoriteUri() {
        if (this.state.favorite) {
            if (this.state.confirmed) {
                let newFavoriteState = this.props.setFavoriteUri(this.state.uri);
                this.setState({favorite: newFavoriteState, action: null, confirmed: false});
                this.props.setTargetUri(this.state.uri);
            } else {
                this.setState({confirmed: true});
            }
        } else {
            let newFavoriteState = this.props.setFavoriteUri(this.state.uri);
            this.setState({favorite: newFavoriteState});
        }
    }

    setTargetUri(uri, contact) {
        if (this.isAnonymous(this.state.uri)) {
            return;
        }

        this.props.setTargetUri(uri, this.contact);
    }

    isAnonymous(uri) {
        if (uri.search('@guest.') > -1 || uri.search('@anonymous.') > -1) {
            return true
        }

        return false;
    }


    render () {
        let containerClass = styles.portraitContainer;
        let cardClass = styles.card;
        //console.log('Render card', this.state.uri, this.state.orientation);

        let showActions = this.props.contact.showActions && this.props.contact.tags.indexOf('test') === -1;

        let uri =  this.state.uri;
        let displayName = this.state.displayName;

        let buttonMode = 'text';
        let showBlockButton = uri.search('@videoconference.') === -1 ? true : false;
        let showFavoriteButton = true;
        let showUndoButton = this.state.confirmed ? true : false;
        let showDeleteButton = this.props.contact.tags.indexOf('local') > -1 ? true: false;
        let blockTextbutton = 'Block';
        let favoriteTextbutton = 'Favorite';
        let undoTextbutton = 'Abort';
        let deleteTextbutton = 'Delete';
        let participantsData = [];

        if (this.isAnonymous(uri)) {
            uri = 'anonymous@anonymous.invalid';
            displayName = displayName + ' - from the Web';
            let showFavoriteButton = false;
        }

        if (this.state.favorite) {
            favoriteTextbutton = this.state.confirmed ? 'Confirm' : 'Remove favorite';
            if (!this.state.blocked) {
                showBlockButton = false;
            }
        }

        if (uri.search('3333@') > -1) {
            showBlockButton = false;
        }

        if (uri.search('4444@') > -1) {
            showBlockButton = false;
        }

        if (displayName === 'Myself') {
            showBlockButton = false;
        }

        if (this.state.blocked) {
            blockTextbutton = 'Unblock';
            showFavoriteButton = false;
        }

        if (this.state.isTablet) {
            containerClass = (this.state.orientation === 'landscape') ? styles.landscapeTabletContainer : styles.portraitTabletContainer;
        } else {
            containerClass = (this.state.orientation === 'landscape') ? styles.landscapeContainer : styles.portraitContainer;
        }

        if (showActions) {
            cardClass = styles.expandedCard;
        }

        let color = {};

        let title = displayName || uri.split('@')[0];
        let subtitle = uri;
        let description = this.props.contact.startTime;

        if (displayName === uri) {
            title = toTitleCase(uri.split('@')[0]);
        }

        if (this.props.contact.tags.indexOf('history') > -1) {

            let duration = moment.duration(this.props.contact.duration, 'seconds').format('HH:mm:ss', {trim: false});

            if (this.props.contact.direction === 'received' && this.props.contact.duration === 0) {
                color.color = '#a94442';
                duration = 'missed';
            } else if (this.props.contact.direction === 'placed' && this.props.contact.duration === 0) {
                duration = 'cancelled';
            }

            if (this.state.conference) {
                if (this.state.participants && this.state.participants.length) {
                    const p_text = this.state.participants.length > 1 ? 'participants' : 'participant';
                    subtitle = 'With ' + this.state.participants.length + ' ' + p_text;
                    let i = 1;
                    let contact_obj;
                    let dn;
                    let _item;
                    this.state.participants.forEach((participant) => {
                        contact_obj = this.findObjectByKey(this.props.contacts, 'remoteParty', participant);
                        dn = contact_obj ? contact_obj.displayName : participant;
                        _item = {nr: i, id: uuid.v4(), uri: participant, displayName: dn};
                        participantsData.push(_item);
                        i = i + 1;
                    });
                } else {
                    subtitle = 'No participants';
                }
            }

            if (!displayName) {
                title = uri;
                if (duration === 'missed') {
                    subtitle = 'Last call missed';
                } else if (duration === 'cancelled') {
                    subtitle = 'Last call cancelled';
                } else {
                    subtitle = 'Last call duration ' + duration ;
                }
            }

            description = description + ' (' + duration + ')';

            return (
                <Card
                    onPress={() => {this.setTargetUri(uri, this.props.contact)}}
                    style={[containerClass, cardClass]}
                    >
                    <Card.Content style={styles.content}>
                        <View style={styles.mainContent}>
                            <Title noWrap style={color}>{title}</Title>
                            <Subheading noWrap style={color}>{subtitle}</Subheading>
                            <Caption color="textSecondary">
                                <Icon name={this.props.contact.direction == 'received' ? 'arrow-bottom-left' : 'arrow-top-right'}/>{description}
                            </Caption>
                            {this.state.participants && this.state.participants.length && showActions ?
                            <SafeAreaView>
                              <FlatList
                                horizontal={false}
                                data={participantsData}
                                renderItem={renderItem}
                                keyExtractor={item => item.id}
                                key={item => item.id}
                              />
                            </SafeAreaView>
                            : null}

                        </View>
                        <View style={styles.userAvatarContent}>
                            <UserIcon style={styles.userIcon} identity={this.state}/>
                        </View>
                    </Card.Content>
                    {showActions ?
                        <View style={styles.buttonContainer}>
                        <Card.Actions>
                           {showDeleteButton? <Button mode={buttonMode} style={styles.button} onPress={() => {this.deleteHistoryEntry()}}>{deleteTextbutton}</Button>: null}
                           {showBlockButton? <Button mode={buttonMode} style={styles.button} onPress={() => {this.setBlockedUri()}}>{blockTextbutton}</Button>: null}
                           {showFavoriteButton?<Button mode={buttonMode} style={styles.button} onPress={() => {this.setFavoriteUri()}}>{favoriteTextbutton}</Button>: null}
                           {showUndoButton?<Button mode={buttonMode} style={styles.button} onPress={() => {this.undo()}}>{undoTextbutton}</Button>: null}
                        </Card.Actions>
                        </View>
                        : null}
                </Card>
            );

        } else {

            return (
                <Card
                    onPress={() => {this.props.setTargetUri(uri, this.props.contact)}}
                    style={[containerClass, cardClass]}
                >
                    <Card.Content style={styles.content}>
                        <View style={styles.mainContent}>
                            <Title noWrap style={color}>{title}</Title>
                            <Subheading noWrap style={color}>{uri}</Subheading>
                            <Caption color="textSecondary">
                                {this.state.label}
                            </Caption>
                        </View>
                        <View style={styles.userAvatarContent}>
                            <UserIcon style={styles.userIcon} identity={this.state}/>
                        </View>
                    </Card.Content>
                    {showActions ?
                        <View style={styles.buttonContainer}>
                        <Card.Actions>
                           {showBlockButton? <Button mode={buttonMode} style={styles.button} onPress={() => {this.setBlockedUri()}}>{blockTextbutton}</Button>: null}
                           {showFavoriteButton?<Button mode={buttonMode} style={styles.button} onPress={() => {this.setFavoriteUri()}}>{favoriteTextbutton}</Button>: null}
                           {showUndoButton?<Button mode={buttonMode} style={styles.button} onPress={() => {this.undo()}}>{undoTextbutton}</Button>: null}
                        </Card.Actions>
                        </View>
                        : null}
                </Card>
            );
        }
    }
}

HistoryCard.propTypes = {
    id             : PropTypes.string,
    contact        : PropTypes.object,
    setTargetUri   : PropTypes.func,
    setBlockedUri  : PropTypes.func,
    setFavoriteUri : PropTypes.func,
    deleteHistoryEntry : PropTypes.func,
    orientation    : PropTypes.string,
    isTablet       : PropTypes.bool,
    contacts       : PropTypes.array
};


export default HistoryCard;
