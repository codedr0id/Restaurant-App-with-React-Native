import React, { Component } from 'react';
import { Text, View, ScrollView, FlatList, Modal, Button, StyleSheet, Alert, PanResponder, Share } from 'react-native';
import { Card, Icon, Input, Rating, AirbnbRating } from 'react-native-elements';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite, postComment } from '../redux/ActionCreators';
import Moment from 'moment';
import * as Animatable from 'react-native-animatable';

const mapStateToProps = state => {
    return {
       dishes: state.dishes,
       comments: state.comments,
       favorites: state.favorites
    }
  }

const mapDispatchToProps = dispatch => ({
    postFavorite: (dishId) => dispatch(postFavorite(dishId)),
    postComment: (dishId, rating, author, comment) => dispatch(postComment(dishId, rating, author, comment))
})

function RenderDish(props) {
    const dish = props.dish;

    handleViewRef = ref => this.view = ref

    const recognizeDrag = ({ dx }) => {
        if ( dx < -200 )
            return true;
        else
            return false;
    }

    const recognizeComment = ({ dx }) => {
        if ( dx > 200 )
            return true;
        else
            return false;
    }

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: (e, gestureState) => {
            return true;
        },

        onPanResponderGrant: () => {this.view.rubberBand(1000).then(endState => console.log(endState.finished ? 'finished' : 'cancelled'));},

        onPanResponderEnd: (e, gestureState) => {
            console.log("pan responder end", gestureState);
            if (recognizeDrag(gestureState)) {
                Alert.alert(
                    'Add Favorite',
                    'Are you sure you wish to add ' + dish.name + ' to favorite?',
                    [
                    {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                    {text: 'OK', onPress: () => {props.favorite ? console.log('Already favorite') : props.onPress()}},
                    ],
                    { cancelable: false }
                );
              }
            else if (recognizeComment(gestureState)) {
              props.onSelect();
            }

            return true;
        }
    })

    const shareDish = (title, message, url) => {
        Share.share({
            title: title,
            message: title + ': ' + message + ' ' + url,
            url: url,
            dialogTitle: 'Share ' + title
        })
    }

    if (dish != null) {
        return(
            <Animatable.View animation="fadeInDown" duration={2000} delay={1000}
              ref={this.handleViewRef}
              {...panResponder.panHandlers}>
                <Card
                featuredTitle={dish.name}
                image={{uri: baseUrl + dish.image}}>
                    <Text style={{margin: 10}}>
                        {dish.description}
                    </Text>
                    <View style={styles.icons}>
                      <Icon
                          raised
                          reverse
                          name={ props.favorite ? 'heart' : 'heart-o'}
                          type='font-awesome'
                          color='#f50'
                          onPress={() => props.favorite ? console.log('Already favorite') : props.onPress()}
                          />
                      <Icon
                          raised
                          reverse
                          name='pencil'
                          type='font-awesome'
                          color='#528'
                          onPress={() => props.onSelect()}
                          />
                      <Icon
                          raised
                          reverse
                          name='share'
                          type='font-awesome'
                          color='#51D2A8'
                          style={styles.cardItem}
                          onPress={() => shareDish(dish.name, dish.description, baseUrl + dish.image)}
                          />
                    </View>
                </Card>
              </Animatable.View>
            );
        }
        else {
            return(<View></View>);
        }
}

function RenderComments(props) {

    const comments = props.comments;
    const renderCommentItem = ({item, index}) => {
        return (
            <View key={index} style={{margin: 10}}>
                <Text style={{fontSize: 14}}>{item.comment}</Text>
                <AirbnbRating
                  size={15}
                  isDisabled={true}
                  reviews={[ "Bad", "OK", "Good", "Very Good", "Amazing" ]}
                  defaultRating={item.rating}
                  style={{ alignItems: "flex-start" }}
                  />
                <Text style={{fontSize: 12, margin: 15}}>{'-- ' + item.author + ', ' + Moment(item.date).format('DD-MMM-YYYY h:mm A')} </Text>
            </View>
        );
    };

    return (
      <Animatable.View animation="fadeInUp" duration={2000} delay={1000}>
        <Card title='Comments' >
        <FlatList
            data={comments}
            renderItem={renderCommentItem}
            keyExtractor={item => item.id.toString()}
            />
        </Card>
      </Animatable.View>
    );
}

class DishDetail extends Component {

    constructor(props) {
        super(props);
        this.state = {
            favorites: [],
            author: "",
            comment: "",
            rating: 5,
            showModal: false
        };
    }

    static navigationOptions = {
      title: 'Dish Details'
    };

    toggleModal = () => {
        this.setState({ showModal: !this.state.showModal });
    }

    handleComment() {
        console.log(JSON.stringify(this.state));
        const { rating, author, comment } = this.state;
        const dishId = this.props.navigation.getParam("dishId", "");
        this.props.postComment(dishId, rating, author, comment);
        this.toggleModal();
    }

    resetForm() {
        this.setState({
          author: "",
          comment: "",
          rating: 6,
          showModal: false
        });
    }

    markFavorite(dishId) {
        this.props.postFavorite(dishId);
    }

    render() {
        const dishId = this.props.navigation.getParam('dishId','');
        return(
          <ScrollView>
              <RenderDish dish={this.props.dishes.dishes[+dishId]}
                  favorite={this.props.favorites.some(el => el === dishId)}
                  onPress={() => this.markFavorite(dishId)}
                  onSelect={() => this.toggleModal()}
                  />
              <RenderComments comments={this.props.comments.comments.filter((comment) => comment.dishId === dishId)} />
              <Modal animationType = {"slide"} transparent = {false}
                  visible = {this.state.showModal}
                  onDismiss = {() => { this.toggleModal() }}
                  onRequestClose = {() => { this.toggleModal() }}
                >
                  <View style={styles.modal}>
                      <AirbnbRating
                        count={5}
                        reviews={[ "Bad", "OK", "Good", "Very Good", "Amazing" ]}
                        defaultRating={5}
                        onFinishRating={rating => this.setState({ rating: rating })}
                        size={20}
                        />
                      <Input
                        placeholder="Author"
                        leftIcon={{ type: 'font-awesome', name: 'user-o' }}
                        onChangeText={value => this.setState({ author: value })}
                        />
                      <Input
                         placeholder="Comment"
                         leftIcon={{ type: 'font-awesome', name: 'comment-o' }}
                         onChangeText={value => this.setState({ comment: value })}
                         />
                      <View style={{ margin: 10 }}>
                       <Button
                         onPress={() => {
                           this.handleComment();
                           this.resetForm();
                           }}
                         color="#512DA8"
                         title="Submit"
                         />
                      </View>
                      <View style={{ margin: 10 }}>
                        <Button
                          onPress={() => {
                            this.toggleModal();
                            this.resetForm();
                            }}
                          color="gray"
                          title="Cancel"
                          />
                      </View>
                  </View>
              </Modal>
          </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
  icons: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    flexDirection: "row"
  },
  formRow: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    flexDirection: "row",
    margin: 20
  },
  formLabel: {
    fontSize: 18,
    flex: 2
  },
  formItem: {
    flex: 1
  },
  modal: {
    justifyContent: "center",
    margin: 20
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    backgroundColor: "#512DA8",
    textAlign: "center",
    color: "white",
    marginBottom: 20
  },
  modalText: {
    fontSize: 18,
    margin: 10
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(DishDetail);
